import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "company-logos";
const MAX_SIZE = 500_000; // 500 KB

/**
 * Attempts to download `sourceUrl`, validate it as an image, upload it to
 * Supabase Storage under `company-logos/logos/{jobId}.{ext}`, then writes
 * the resulting public URL into `jobs.company_logo_storage_url`.
 *
 * Returns the new storage URL on success, or null on any non-fatal failure.
 */
async function fetchAndStore(
  supabase: any,
  jobId: string,
  sourceUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "CareerUpdatesBot/1.0" },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      console.log(`[LogoStorage] HTTP ${res.status} for ${sourceUrl}`);
      return null;
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      console.log(`[LogoStorage] Non-image content-type "${ct}" for ${sourceUrl}`);
      return null;
    }

    const buffer = await res.arrayBuffer();

    if (buffer.byteLength < 100 || buffer.byteLength > MAX_SIZE) {
      console.log(`[LogoStorage] Size out of range: ${buffer.byteLength} bytes`);
      return null;
    }

    const ext =
      ct.includes("svg")  ? "svg"  :
      ct.includes("webp") ? "webp" :
      ct.includes("jpg") || ct.includes("jpeg") ? "jpg" : "png";

    const path = `logos/${jobId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: ct,
        upsert: true,
        cacheControl: "31536000", // 1 year
      });

    if (uploadErr) {
      console.log(`[LogoStorage] Upload error: ${uploadErr.message}`);
      return null;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return pub?.publicUrl ?? null;
  } catch (err: any) {
    console.log(`[LogoStorage] fetchAndStore error: ${err.message}`);
    return null;
  }
}

/**
 * Caches the logo for a SINGLE job into Supabase Storage.
 * Called from the admin migration panel and optionally after AI ingestion.
 */
export const cacheLogoForJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({ jobId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { jobId } = data;

    // Fetch the job to get existing URLs
    const { data: job, error: fetchErr } = await context.supabase
      .from("jobs")
      .select("id, company, company_logo, company_logo_storage_url, apply_url")
      .eq("id", jobId)
      .single();

    if (fetchErr || !job) {
      return { success: false, reason: "job-not-found" };
    }

    // Already has a storage URL — nothing to do
    if (job.company_logo_storage_url?.includes("supabase.co/storage")) {
      return { success: true, cached: false, reason: "already-cached", url: job.company_logo_storage_url };
    }

    // Determine source URL to download (storage_url > logo > google favicon)
    const domain = (() => {
      try {
        const raw = job.company_logo ?? job.apply_url ?? "";
        const u = new URL(raw);
        if (u.hostname === "logo.clearbit.com") return u.pathname.replace(/^\//, "");
        return u.hostname.replace(/^www\./, "");
      } catch { return null; }
    })();

    const candidates = [
      job.company_logo,
      domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    ].filter(Boolean) as string[];

    let storedUrl: string | null = null;
    for (const src of candidates) {
      storedUrl = await fetchAndStore(context.supabase, jobId, src);
      if (storedUrl) break;
    }

    if (!storedUrl) {
      return { success: false, reason: "all-sources-failed" };
    }

    // Save the permanent URL back to the DB
    const { error: updateErr } = await context.supabase
      .from("jobs")
      .update({ company_logo_storage_url: storedUrl })
      .eq("id", jobId);

    if (updateErr) {
      return { success: false, reason: `db-update-failed: ${updateErr.message}` };
    }

    console.log(`[LogoStorage] Cached for job ${jobId}: ${storedUrl}`);
    return { success: true, cached: true, url: storedUrl };
  });

/**
 * Bulk migration — processes all published jobs that don't yet have a
 * company_logo_storage_url. Designed to be called once from the admin panel.
 *
 * Returns a summary of processed / skipped / failed jobs.
 */
export const migrateAllLogos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Fetch all jobs without a stored logo (limit 200 per call for safety)
    const { data: jobs, error } = await context.supabase
      .from("jobs")
      .select("id, company, company_logo, company_logo_storage_url, apply_url")
      .is("company_logo_storage_url", null)
      .order("posted_date", { ascending: false })
      .limit(200);

    if (error) {
      return { success: false, reason: error.message, processed: 0, succeeded: 0, failed: 0 };
    }

    if (!jobs || jobs.length === 0) {
      return { success: true, processed: 0, succeeded: 0, failed: 0, message: "All logos already cached." };
    }

    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      const domain = (() => {
        try {
          const raw = job.company_logo ?? job.apply_url ?? "";
          const u = new URL(raw);
          if (u.hostname === "logo.clearbit.com") return u.pathname.replace(/^\//, "");
          return u.hostname.replace(/^www\./, "");
        } catch { return null; }
      })();

      const candidates = [
        job.company_logo,
        domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
      ].filter(Boolean) as string[];

      let storedUrl: string | null = null;
      for (const src of candidates) {
        storedUrl = await fetchAndStore(context.supabase, job.id, src);
        if (storedUrl) break;
      }

      if (storedUrl) {
        await context.supabase
          .from("jobs")
          .update({ company_logo_storage_url: storedUrl })
          .eq("id", job.id);
        succeeded++;
      } else {
        failed++;
      }

      // Small delay to avoid hammering external CDNs
      await new Promise((r) => setTimeout(r, 150));
    }

    return {
      success: true,
      processed: jobs.length,
      succeeded,
      failed,
      message: `Processed ${jobs.length} jobs. ${succeeded} cached, ${failed} failed (will use fallback).`,
    };
  });

/**
 * Returns a count of jobs that still need logo migration.
 */
export const getLogoMigrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ count: total }, { count: cached }] = await Promise.all([
      context.supabase.from("jobs").select("*", { count: "exact", head: true }),
      context.supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .not("company_logo_storage_url", "is", null),
    ]);
    return {
      total: total ?? 0,
      cached: cached ?? 0,
      pending: (total ?? 0) - (cached ?? 0),
    };
  });
