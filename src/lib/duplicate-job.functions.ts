import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .single();

  if (!data || data.role !== "admin") {
    throw new Error("Unauthorized. Admin access required.");
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const checkDuplicateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { url: string; company?: string; title?: string; exclude_id?: string }) => 
    z.object({
      url: z.string().url(),
      company: z.string().optional(),
      title: z.string().optional(),
      exclude_id: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const { url, company, title, exclude_id } = data;

    // Priority 1: Exact Apply URL
    let query1 = context.supabase.from("jobs").select("*").eq("apply_url", url);
    if (exclude_id) query1 = query1.neq("id", exclude_id);
    const { data: applyUrlMatch } = await query1.limit(1).maybeSingle();
      
    if (applyUrlMatch) {
      return { duplicate: true, reason: "apply_url", existingJob: applyUrlMatch };
    }

    // Priority 2: source_url (Currently not in schema, skipping to avoid Supabase error, but could be added if schema changes)
    
    // Priority 3 & 4: Only possible if company and title are provided (usually after AI extraction)
    if (company && title) {
      // Priority 3: generated slug match
      const generatedSlug = slugify(`${company}-${title}`);
      let query3 = context.supabase.from("jobs").select("*").eq("slug", generatedSlug);
      if (exclude_id) query3 = query3.neq("id", exclude_id);
      const { data: slugMatch } = await query3.limit(1).maybeSingle();

      if (slugMatch) {
        return { duplicate: true, reason: "slug", existingJob: slugMatch };
      }

      // Priority 4: company + title match
      let query4 = context.supabase.from("jobs").select("*").eq("company", company).eq("title", title);
      if (exclude_id) query4 = query4.neq("id", exclude_id);
      const { data: companyTitleMatch } = await query4.limit(1).maybeSingle();

      if (companyTitleMatch) {
        return { duplicate: true, reason: "company_title", existingJob: companyTitleMatch };
      }
    }

    // If we only have URL and nothing else matched, we might want to check if the URL generates a slug?
    // But without title/company, we can't generate the slug "exactly the same way".
    // If the user meant URL slug, we can check it, but application generates slug from company+title.

    return { duplicate: false, reason: null, existingJob: null };
  });
