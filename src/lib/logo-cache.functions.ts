import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Downloads a company logo from an external URL and stores it in Supabase Storage.
 * Updates the job record with the new storage URL.
 * 
 * This eliminates external hotlink failures and speeds up logo loading
 * since logos are served from our own CDN (Supabase Storage).
 * 
 * Gracefully no-ops if Storage is unavailable or bucket doesn't exist.
 */
export const cacheLogoToStorage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        logoUrl: z.string().url(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { jobId, logoUrl } = data;

    try {
      // Don't re-cache if already served from our Supabase storage
      if (logoUrl.includes("supabase.co/storage")) {
        return { success: true, cached: false, reason: "already-cached" };
      }

      // Download the logo
      const response = await fetch(logoUrl, {
        headers: { "User-Agent": "CareerUpdatesBot/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, cached: false, reason: `fetch-failed-${response.status}` };
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const buffer = await response.arrayBuffer();

      // Only cache reasonably sized images (>100 bytes, <500KB)
      if (buffer.byteLength < 100 || buffer.byteLength > 500_000) {
        return { success: false, cached: false, reason: "size-out-of-range" };
      }

      const ext = contentType.includes("svg") ? "svg" : contentType.includes("webp") ? "webp" : contentType.includes("jpg") || contentType.includes("jpeg") ? "jpg" : "png";
      const filename = `logos/${jobId}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await context.supabase.storage
        .from("logos")
        .upload(filename, buffer, {
          contentType,
          upsert: true,
          cacheControl: "31536000", // 1 year
        });

      if (uploadError) {
        // Bucket might not exist yet — graceful fallback
        console.log(`[LogoCache] Storage upload failed: ${uploadError.message}`);
        return { success: false, cached: false, reason: uploadError.message };
      }

      // Get the public URL
      const { data: publicData } = context.supabase.storage
        .from("logos")
        .getPublicUrl(filename);

      const newLogoUrl = publicData.publicUrl;

      // Update the job record
      const { error: updateError } = await context.supabase
        .from("jobs")
        .update({ company_logo: newLogoUrl })
        .eq("id", jobId);

      if (updateError) {
        console.log(`[LogoCache] DB update failed: ${updateError.message}`);
        return { success: false, cached: false, reason: updateError.message };
      }

      console.log(`[LogoCache] Logo cached successfully for job ${jobId}: ${newLogoUrl}`);
      return { success: true, cached: true, newLogoUrl };
    } catch (err: any) {
      console.log(`[LogoCache] Error: ${err.message}`);
      return { success: false, cached: false, reason: err.message };
    }
  });
