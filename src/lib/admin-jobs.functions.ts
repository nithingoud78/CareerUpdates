import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const JobInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  company_logo: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  employment_type: z.string().nullable().optional(),
  qualification: z.string().nullable().optional(),
  apply_url: z.string().url(),
  description: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().nullable().optional(),
  status: z.enum(["published", "expired", "archived"]).default("published"),
  last_date: z.string().nullable().optional(),
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const upsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => JobInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload: any = { ...data, created_by: context.userId };
    const now = new Date().toISOString();

    if (data.id) {
      const { data: updatedRow, error } = await context.supabase
        .from("jobs")
        .update(payload)
        .eq("id", data.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { action: "updated", jobId: updatedRow.id };
    }

    let duplicateJobId = null;

    const { data: byUrl } = await context.supabase
      .from("jobs")
      .select("id")
      .eq("apply_url", data.apply_url)
      .limit(1)
      .maybeSingle();

    if (byUrl) {
      duplicateJobId = byUrl.id;
    } else {
      const { data: matches } = await context.supabase
        .from("jobs")
        .select("id, location")
        .eq("company", data.company)
        .eq("title", data.title);

      if (matches && matches.length > 0) {
        const exactLoc = matches.find((m: any) => m.location === data.location);
        duplicateJobId = exactLoc ? exactLoc.id : matches[0].id;
      }
    }

    if (duplicateJobId) {
      const updatePayload = {
        salary: data.salary,
        last_date: data.last_date,
        description: data.description,
        ai_summary: data.ai_summary,
        tags: data.tags,
      };

      const { data: updatedRow, error } = await context.supabase
        .from("jobs")
        .update(updatePayload)
        .eq("id", duplicateJobId)
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return { action: "updated", jobId: updatedRow.id };
    }


    let isUnique = false;
    let suffix = 1;
    let candidateSlug = payload.slug;

    while (!isUnique) {
      const { data: existing } = await context.supabase
        .from("jobs")
        .select("id")
        .eq("slug", candidateSlug)
        .maybeSingle();
        
      if (!existing) {
        isUnique = true;
      } else {
        suffix++;
        candidateSlug = `${data.slug}-${suffix}`;
      }
    }
    payload.slug = candidateSlug;

    const { data: newRow, error } = await context.supabase
      .from("jobs")
      .insert(payload)
      .select("id")
      .single();
      
    if (error) throw new Error(error.message);
    return { action: "created", jobId: newRow.id };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("jobs")
      .select("id, slug, title, company, category, status, posted_date, last_date, views")
      .order("posted_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["published", "expired", "archived"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("jobs")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
