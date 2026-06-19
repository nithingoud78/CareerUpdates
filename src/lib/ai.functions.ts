import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractJobPage, assessContentQuality } from "./job-page-extractor";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

const DEFAULT_AI_GATEWAY_URL = process.env.DEFAULT_AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";

async function getActiveProvider(supabase: any): Promise<{
  provider: string;
  model: string;
  baseUrl: string;
  headers: Record<string, string>;
}> {
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || data.provider === "lovable" || data.provider === "default") {
    const key = process.env.AI_GATEWAY_API_KEY;
    if (!key) throw new Error("AI_GATEWAY_API_KEY missing");
    return {
      provider: data?.provider || "default",
      model: data?.model || "google/gemini-3-flash-preview",
      baseUrl: DEFAULT_AI_GATEWAY_URL,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    };
  }
  if (!data.api_key) throw new Error("API key not configured for provider " + data.provider);
  return {
    provider: data.provider,
    model: data.model,
    baseUrl: data.base_url || "https://api.openai.com/v1",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.api_key}`,
    },
  };
}

async function chat(supabase: any, system: string, user: string, json = false) {
  const cfg = await getActiveProvider(supabase);

  const isGemini =
    cfg.provider === "gemini" ||
    cfg.baseUrl.includes("generativelanguage.googleapis.com");

  const finalSystem =
    json
      ? `${system}\n\nReturn ONLY valid JSON.\nDo not use markdown.\nDo not wrap JSON in code fences.\n`
      : system;

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [
      { role: "system", content: finalSystem },
      { role: "user", content: user },
    ],
  };

  if (json && !isGemini) {
    body.response_format = {
      type: "json_object",
    };
  }

  if (import.meta.env.DEV) {
    console.log("AI Provider:", cfg.provider);
    console.log("Model:", cfg.model);
    console.log("Base URL:", cfg.baseUrl);
    console.log("Headers:", {
      ...cfg.headers,
      Authorization: cfg.headers.Authorization
        ? "***hidden***"
        : undefined,
    });
    console.log("Request Body:", JSON.stringify(body, null, 2));
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: cfg.headers,
    body: JSON.stringify(body),
  });

  const responseText = await res.text();

  if (import.meta.env.DEV) {
    console.log("AI Status:", res.status);
    console.log("AI Response:", responseText);
  }

  if (!res.ok) {
    if (res.status === 429) throw new Error(`Gemini 429 Rate Limit: ${responseText}`);
    if (res.status === 402) throw new Error("AI credits exhausted. Top up to continue.");
    throw new Error(`AI provider error (${res.status}): ${responseText}`);
  }
  
  const j = JSON.parse(responseText);
  return j.choices?.[0]?.message?.content ?? "";
}



function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const extractJobFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ url: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    let pageText = await extractJobPage(data.url);
    if (import.meta.env.DEV) {
      console.log("Job URL:", data.url);
      console.log("Extracted text length:", pageText.length);
    }

    // Quick entity cleanup for Jina's output if needed
    pageText = pageText
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");

    // Assess quality for logging purposes, but clean unconditionally
    const quality = assessContentQuality(pageText);
    if (import.meta.env.DEV) {
      console.log(`Pre-cleanup quality score: ${quality.score}. Reasons: ${quality.reasons.join(", ")}.`);
    }

    let finalDescription = pageText;

    const cleanPrompt = `You are an expert job description normalizer. Below is raw text extracted from a job posting webpage.
      
Your task is to extract ONLY the actual job description and format it strictly as structured Markdown.

CRITICAL RULES:
1. Remove all navigation menus, header content, footer content, and legal boilerplate.
2. Remove any JSON blocks, Schema.org data, or JavaScript code.
3. Remove repeated company branding or "About Us" marketing text unless it specifically describes the role.
4. Structure the output using these EXACT Markdown headings (only include sections where enough information exists):
   ## About the Role
   ## Responsibilities
   ## Requirements
   ## Preferred Qualifications
   ## Benefits
5. Output ONLY the cleaned Markdown text. Do not include any conversational text.

RAW TEXT:
${pageText.slice(0, 15000)}`;

    try {
      finalDescription = await chat(context.supabase, "You clean and normalize job descriptions into structured Markdown.", cleanPrompt, false);
    } catch (err) {
      console.error("AI normalization failed, using original", err);
    }

    const system =
      "You extract job posting information. Always respond with strict JSON matching the requested schema. Use null when a field cannot be determined.";
    const prompt = `Extract job details from this page text and URL.

URL: ${data.url}
PAGE TEXT: ${finalDescription || "(page could not be fetched - infer best you can from the URL)"}

Return strictly this JSON shape:
{
  "title": string,
  "company": string,
  "location": string|null,
  "experience": string|null,
  "salary": string|null,
  "employment_type": string|null,
  "qualification": string|null,
  "category": string|null,
  "company_logo": string|null,
  "last_date": string|null,
  "ai_summary": string,
  "meta_description": string,
  "tags": string[]
}

- ai_summary: a clear 2-3 sentence overview of the role for job seekers.
- last_date: search raw text for "application deadline", "closing date", "apply before", "applications close", "last date to apply", "deadline". Normalize to YYYY-MM-DD. If multiple dates exist, choose the application deadline. If no deadline exists, return null.
- meta_description: under 160 characters, SEO friendly.
- tags: 3-6 short tags (company, role type, technology, fresher/experienced, etc).`;

    const content = await chat(context.supabase, system, prompt, true);
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI did not return valid JSON");
      parsed = JSON.parse(match[0]);
    }

    const slug = slugify(`${parsed.company ?? "job"}-${parsed.title ?? ""}`) || `job-${Date.now()}`;

    return {
      slug,
      apply_url: data.url,
      title: parsed.title ?? "",
      company: parsed.company ?? "",
      location: parsed.location ?? null,
      experience: parsed.experience ?? null,
      salary: parsed.salary ?? null,
      employment_type: parsed.employment_type ?? null,
      qualification: parsed.qualification ?? null,
      category: parsed.category ?? null,
      last_date: parsed.last_date ?? null,
      description: finalDescription ? finalDescription.slice(0, 15000) : "",
      ai_summary: parsed.ai_summary ?? "",
      meta_description: parsed.meta_description ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      company_logo: parsed.company_logo ?? null,
    };
  });

const SummarySchema = z.object({
  ai_summary: z.string(),
  meta_description: z.string(),
  tags: z.array(z.string()),
});

export const regenerateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        title: z.string(),
        company: z.string(),
        description: z.string().optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const systemPrompt = "You are an expert SEO copywriter. You MUST reply with STRICT raw JSON only. Do NOT wrap in markdown code fences (no ```json). Do NOT add any conversational prose. Your response must be parseable by JSON.parse() immediately.";
    
    const userPrompt = `Job: ${data.title} at ${data.company}.
Description: ${data.description.slice(0, 4000)}

Return STRICT JSON matching exactly this schema:
{
  "ai_summary": "2-3 sentence overview for job seekers",
  "meta_description": "under 160 chars SEO description",
  "tags": ["short", "tags"]
}`;

    let lastError = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      let content = "";
      try {
        content = await chat(context.supabase, systemPrompt, userPrompt, true);
        
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          // Fallback if the AI stubbornly included code fences
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            parsed = JSON.parse(m[0]);
          } else {
            throw new Error("No JSON object found in response");
          }
        }

        // Validate structure
        const validated = SummarySchema.parse(parsed);
        return validated;

      } catch (err: any) {
        lastError = err;
        console.error(`[RegenerateSummary] Attempt ${attempt} failed.`);
        console.error(`[RegenerateSummary] Raw AI Response:\n${content}`);
        console.error(`[RegenerateSummary] Error:\n${err.message}`);
      }
    }

    throw new Error("The AI generated an invalid format. Please try again or edit manually.");
  });

export const auditAllJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data: jobs, error } = await context.supabase
      .from("jobs")
      .select("id, title, company, description")
      .order("posted_date", { ascending: false });

    if (error) throw new Error(error.message);

    const results = jobs.map((job: any) => {
      const q = assessContentQuality(job.description || "");
      let category = "clean";
      if (q.score < 50) category = "broken";
      else if (q.score < 80) category = "suspicious";

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        score: q.score,
        reasons: q.reasons,
        category,
        descriptionLength: job.description?.length || 0,
      };
    });

    return results;
  });

export const recleanJobDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    try {
      console.log("\n=== START RECLEAN ===");
      console.log("1. Job ID:", data.id);

      await assertAdmin(context);

      const { data: job, error: fetchErr } = await context.supabase
        .from("jobs")
        .select("id, title, company, description")
        .eq("id", data.id)
        .single();

      if (fetchErr || !job) throw new Error("Job not found: " + (fetchErr?.message || ""));
      if (!job.description) throw new Error("No description to clean");

      console.log("2. Description length:", job.description.length);
      console.log("3. Description preview:\n", job.description.slice(0, 300));

      const oldScore = assessContentQuality(job.description).score;
      console.log("4. Quality score:", oldScore);

      const cleanPrompt = `You are an expert job description normalizer. Below is raw text extracted from a job posting webpage.
        
  Your task is to extract ONLY the actual job description and format it strictly as structured Markdown.

  CRITICAL RULES:
  1. Remove all navigation menus, header content, footer content, and legal boilerplate.
  2. Remove any JSON blocks, Schema.org data, or JavaScript code.
  3. Remove repeated company branding or "About Us" marketing text unless it specifically describes the role.
  4. Structure the output using these EXACT Markdown headings (only include sections where enough information exists):
    ## About the Role
    ## Responsibilities
    ## Requirements
    ## Preferred Qualifications
    ## Benefits
  5. Output ONLY the cleaned Markdown text. Do not include any conversational text.

  RAW TEXT:
  ${job.description.slice(0, 15000)}`;

      console.log("5. AI request sent (Normalization)");
      const newDescription = await chat(context.supabase, "You clean and normalize job descriptions into structured Markdown.", cleanPrompt, false);
      console.log("6. Raw AI response (Normalization preview):\n", newDescription.slice(0, 300));

      console.log("5. AI request sent (Summary Generation)");
      const summaryPrompt = `Job: ${job.title} at ${job.company}.\nDescription: ${newDescription.slice(0, 4000)}\n\nReturn JSON:\n{ "ai_summary": "2-3 sentence overview for job seekers", "meta_description": "under 160 chars SEO description" }`;
      const summaryJsonStr = await chat(context.supabase, "You write concise SEO-friendly job content. Reply with strict JSON.", summaryPrompt, true);
      
      console.log("6. Raw AI response (Summary):", summaryJsonStr);
      
      let summaryJson;
      try {
        summaryJson = JSON.parse(summaryJsonStr);
      } catch (err) {
        const m = summaryJsonStr.match(/\{[\s\S]*\}/);
        if (m) {
          summaryJson = JSON.parse(m[0]);
        } else {
          console.error("AI JSON Parse Error:", err);
          throw new Error("AI returned invalid JSON for summaries: " + summaryJsonStr);
        }
      }
      
      console.log("7. Parsed AI response:", JSON.stringify(summaryJson));

      console.log("8. Executing database update...");
      const { error: updateErr } = await context.supabase
        .from("jobs")
        .update({
          description: newDescription,
          ai_summary: summaryJson.ai_summary,
          meta_description: summaryJson.meta_description,
        })
        .eq("id", job.id);

      if (updateErr) {
        console.error("Database update error:", updateErr);
        throw new Error("DB Update Error: " + updateErr.message);
      }
      console.log("8. Database update result: SUCCESS");

      const newScore = assessContentQuality(newDescription).score;

      return { 
        success: true, 
        oldScore, 
        newScore, 
        descriptionLength: newDescription.length 
      };
    } catch (error: any) {
      console.error("\n9. Full error stack:\n", error);
      throw error;
    }
  });
