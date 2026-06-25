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
  console.log("[Execution] getActiveProvider started");
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log(`[Trace] Selected provider from database: ${data?.provider || "None (fallback to default)"}`);

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
  let cfg;
  try {
    cfg = await getActiveProvider(supabase);
  } catch (err: any) {
    if (err.message.includes("API key not configured")) {
      throw new Error("Invalid AI API key");
    }
    if (err.message.includes("AI_GATEWAY_API_KEY missing")) {
      throw new Error("Missing AI API key");
    }
    throw err;
  }

  console.log(`[Trace] Provider actually used: ${cfg.provider}`);
  console.log(`[Trace] Endpoint URL: ${cfg.baseUrl}`);
  console.log(`[Trace] Model name: ${cfg.model}`);
  console.log(`[Trace] Authorization header exists: ${!!cfg.headers.Authorization || !!cfg.headers["Lovable-API-Key"]}`);

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

  const attemptRequest = async (attempt: number) => {
    try {
      console.log(`[Chat] Sending fetch request to AI Provider (${cfg.provider})...`);
      const requestUrl = `${cfg.baseUrl}/chat/completions`;
      console.log(`[Trace] HTTP request URL: ${requestUrl}`);
      console.log(`[Trace] Timeout: 30000ms`);

      const res = await fetch(requestUrl, {
        method: "POST",
        headers: cfg.headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log(`[Trace] HTTP response status: ${res.status}`);
      const responseText = await res.text();
      
      console.log(`[Trace] Response body (first 1000 chars): ${responseText.slice(0, 1000)}`);

      if (!res.ok) {
        if (res.status === 429) throw new Error("Rate limit reached, try again later");
        if (res.status === 401 || res.status === 403) throw new Error("Invalid AI API key");
        if (res.status === 402) throw new Error("AI credits exhausted. Top up to continue.");
        console.error(`AI Provider Error (${res.status}):`, responseText);
        throw new Error("AI service unavailable");
      }
      
      const j = JSON.parse(responseText);
      return j.choices?.[0]?.message?.content ?? "";
    } catch (err: any) {
      console.error(`[Chat] Error during attemptRequest: ${err.name} - ${err.message}`);
      if (err.name === "TimeoutError" || err.message === "fetch failed") {
        throw new Error("AI service timeout, try again later");
      }
      throw err;
    }
  };

  let lastError: Error | null = null;
  for (let i = 1; i <= 3; i++) {
    try {
      return await attemptRequest(i);
    } catch (err: any) {
      lastError = err;
      console.error(`Chat attempt ${i} failed:`, err.message);
      // Don't retry auth or rate limit or user errors
      if (err.message === "Invalid AI API key" || err.message === "Missing AI API key") {
        throw err;
      }
      // Wait before retry
      if (i < 3) await new Promise(r => setTimeout(r, 2000 * i));
    }
  }

  throw lastError || new Error("AI service unavailable");
}

export const checkAiHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context);
      await chat(context.supabase, "You are a helpful assistant.", "Say 'ok' if you are online.");
      return { status: "Connected" };
    } catch (err: any) {
      if (err.message === "Invalid AI API key" || err.message === "Missing AI API key") {
        return { status: "Invalid Key" };
      }
      return { status: "Unavailable", error: err.message };
    }
  });



function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const JobExtractionSchema = z.object({
  title: z.string().min(1, "Title is required").catch("Unknown Job Title"),
  company: z.string().min(1, "Company is required").catch("Unknown Company"),
  location: z.string().nullable().default(null),
  experience: z.string().default("Not Mentioned"),
  salary: z.string().default("Not Mentioned"),
  employment_type: z.string().default("Full-time"),
  qualification: z.string().default("Not Mentioned"),
  category: z.string().default("Other"),
  subcategory: z.string().default("General"),
  company_logo: z.string().nullable().default(null),
  deadline: z.string().nullable().default(null),
  description: z.string().default(""),
  ai_summary: z.string().default(""),
  meta_description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  apply_url: z.string().nullable().default(null),
});

export async function extractJobFromUrlInternal(data: { url: string }, supabaseClient: any) {
  console.log("=== EXTRACTION PIPELINE START ===");
  console.log("URL fetch started:", data.url);

  let pageText = await extractJobPage(data.url);
  console.log("URL fetch completed");
  console.log("HTML size:", pageText.length);

  // Quick entity cleanup
  pageText = pageText
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  const quality = assessContentQuality(pageText);

  const systemPrompt = "You are an expert Job Extraction AI. You strictly return valid JSON matching the exact schema requested. Do not wrap JSON in code fences. Use null for missing fields.";
  
  const userPrompt = `Extract job details from the following raw page text.

URL: ${data.url}
PAGE TEXT:
${pageText.slice(0, 15000)}

TAXONOMY FOR CATEGORY & SUBCATEGORY:
You MUST map the job to EXACTLY ONE of these Categories, and EXACTLY ONE of its corresponding Subcategories.
1. IT
   Subcategories: Software Engineering, Frontend, Backend, Full Stack, Mobile, Cloud, DevOps, Cybersecurity, AI/ML, Data Engineering, Data Science, QA, Technical Support
2. Government
   Subcategories: Banking, PSU, Railways, Defence, SSC, UPSC, State Government
3. Internship
   Subcategories: Software, Data, AI, Marketing, Finance
4. Business
   Subcategories: HR, Sales, Marketing, Operations, Finance, Analyst

CRITICAL EXTRACTION RULES (STRICTLY FOLLOW):
1. **NO HALLUCINATIONS**: Never invent Salary, Location, Benefits, Experience, or Degree. Only infer when there is strong evidence.
2. **SMART INFERENCE (Fields)**:
   - **Salary**: If missing, output exactly "Not Mentioned".
   - **Employment Type**: Look for "Internship", "Contract", "Part-time", "Remote Contract". Otherwise, default to "Full-time".
   - **Experience**: Infer from JD (e.g., "Freshers", "0-1 years", "5+ years"). Do not leave blank. If absolutely impossible to find, use "Not Mentioned".
   - **Qualification**: Infer from Education/Degree requirements (e.g., "B.E/B.Tech", "Any Graduate", "Bachelor's Degree"). Never leave blank. If impossible, use "Not Mentioned".
3. **ORIGINAL DESCRIPTION (Plagiarism-Safe)**:
   - Generate an ORIGINAL, professionally written job overview. NEVER copy sentences verbatim. Rewrite every paragraph while preserving meaning, facts, and tone.
   - Use Markdown format.
   - Generate structured bullet lists for:
     - **## Responsibilities**: Structured bullet points (e.g., "• Build...", "• Collaborate...").
     - **## Requirements**: Separate bullet list.
     - **## Nice to Have**: Only include if the JD mentions preferred skills. Otherwise, omit this section.
     - **## Benefits**: Extract health insurance, WFH, paid leave, relocation, etc. If absent, omit the section.
4. **AI SUMMARY**: Generate a richer summary of 2-4 paragraphs covering responsibilities, candidate profile, and growth opportunity. It should feel like a human wrote it.
5. **TAGS (Key Skills)**: Automatically extract key technical and soft skills (e.g., Java, React, SQL, Leadership) and store them as an array of tags.
6. **deadline**: Look for application deadline, closing date, apply before, etc. Format as YYYY-MM-DD.

Return strictly this JSON shape:
{
  "title": "string",
  "company": "string",
  "location": "string | null",
  "experience": "string",
  "salary": "string",
  "employment_type": "string",
  "qualification": "string",
  "category": "string",
  "subcategory": "string",
  "company_logo": "string | null",
  "deadline": "YYYY-MM-DD | null",
  "description": "string (Markdown)",
  "ai_summary": "string",
  "meta_description": "string",
  "tags": ["skill1", "skill2"],
  "apply_url": "string | null"
}`;

  let parsed: any = null;
  let lastError: any = null;

  // Retry loop for Gemini extraction up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`\n--- Gemini attempt ${attempt} ---`);
      console.log("Gemini request sent");
      const startTime = Date.now();
      const content = await chat(supabaseClient, systemPrompt, userPrompt, true);
      console.log(`Gemini response received in ${Date.now() - startTime}ms`);
      console.log("Raw Gemini response size:", content.length);
      console.log("Raw Gemini response snippet:", content.slice(0, 200) + "...");
      if (!content.includes("{")) {
        console.log("Raw Gemini response is plain text:", content);
      }
      
      let jsonStr = content;
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        jsonStr = match[0];
      }
      
      let rawJson;
      try {
        rawJson = JSON.parse(jsonStr);
        console.log("Parsed JSON successfully");
      } catch (e: any) {
        console.error("JSON parsing failed:", e.message);
        throw new Error("Invalid JSON format");
      }
      
      // Strict Zod validation
      try {
        parsed = JobExtractionSchema.parse(rawJson);
        console.log("Zod validation result: SUCCESS");
      } catch (e: any) {
        console.error("Zod validation result: FAILED");
        console.error("Zod errors:", e.errors || e.message);
        throw e;
      }
      
      // Enforce Taxonomy Fallback if it hallucinated categories
      const validCategories = ["IT", "Government", "Internship", "Business"];
      if (!validCategories.includes(parsed.category)) {
        parsed.category = "Other";
        parsed.subcategory = "General";
      }

      break; // Success
    } catch (err: any) {
      lastError = err;
      console.error(`Retry reason:`, err.message);
      if (attempt === 3) {
        throw new Error("AI failed to extract valid job data after 3 attempts. " + err.message);
      }
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (!parsed) {
    throw new Error("Failed to parse job data");
  }

  const slug = slugify(`${parsed.company}-${parsed.title}`) || `job-${Date.now()}`;

  return {
    slug,
    apply_url: parsed.apply_url || data.url,
    title: parsed.title,
    company: parsed.company,
    location: parsed.location,
    experience: parsed.experience,
    salary: parsed.salary,
    employment_type: parsed.employment_type,
    qualification: parsed.qualification,
    category: parsed.category,
    subcategory: parsed.subcategory,
    last_date: parsed.deadline,
    description: parsed.description,
    ai_summary: parsed.ai_summary,
    meta_description: parsed.meta_description,
    tags: parsed.tags,
    company_logo: parsed.company_logo,
  };
}

export const extractJobFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ url: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return extractJobFromUrlInternal(data, context.supabase);
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
