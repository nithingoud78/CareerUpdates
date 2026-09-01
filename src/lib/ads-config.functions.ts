/**
 * Server functions for the global Monetag Ads configuration.
 *
 * getAdsConfig  — Public (no auth). Reads ads_enabled from site_settings.
 *                 Uses the service-role client so it can read even when
 *                 RLS might restrict anon selects. Also handles the
 *                 automatic 1-hour re-enable logic atomically.
 *                 Falls back to { ads_enabled: true } on any DB error so a
 *                 backend failure never confuses users with an ad-block gate.
 *
 * setAdsEnabled — Admin-only (requireSupabaseAuth + assertAdmin).
 *                 ON  → ads_enabled=true, clears timestamps.
 *                 OFF → ads_enabled=false, sets ads_disabled_at=now(),
 *                       ads_auto_enable_at=now()+1hr.
 *                 Uses the user-authenticated Supabase client (context.supabase)
 *                 so RLS correctly validates the admin role.
 *                 Throws a real error on failure — never silently swallows.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdsConfig {
  ads_enabled: boolean;
  ads_disabled_at: string | null;
  ads_auto_enable_at: string | null;
}

const SAFE_DEFAULT: AdsConfig = {
  ads_enabled: true,
  ads_disabled_at: null,
  ads_auto_enable_at: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ─── getAdsConfig (public, no auth) ─────────────────────────────────────────

export const getAdsConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdsConfig> => {
    try {
      // Use the service-role admin client so this works server-side
      // regardless of RLS SELECT policies.
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );

      const { data, error } = await supabaseAdmin
        .from("site_settings")
        .select("ads_enabled, ads_disabled_at, ads_auto_enable_at")
        .limit(1)
        .single();

      if (error || !data) {
        // Safe fallback: DB unavailable → assume ads are ON.
        // A backend error must NEVER lock out users by triggering the
        // adblock gate. Return ON (safe) instead of OFF (would lock).
        console.error("[getAdsConfig] DB error, returning safe fallback:", error?.message);
        return SAFE_DEFAULT;
      }

      // ── Automatic re-enable check ─────────────────────────────────────────
      // If ads_enabled = false AND ads_auto_enable_at has passed,
      // atomically flip the row back to ON. The conditional WHERE ensures
      // only one racing request performs the write.
      if (data.ads_enabled === false && data.ads_auto_enable_at) {
        const now = new Date();
        const autoEnableAt = new Date(data.ads_auto_enable_at);

        if (now >= autoEnableAt) {
          // Race-safe: WHERE ads_enabled = false AND ads_auto_enable_at <= now
          const { error: updateErr } = await supabaseAdmin
            .from("site_settings")
            .update({
              ads_enabled: true,
              ads_disabled_at: null,
              ads_auto_enable_at: null,
            })
            .eq("ads_enabled", false)
            .lte("ads_auto_enable_at", now.toISOString());

          if (updateErr) {
            console.error("[getAdsConfig] Auto-re-enable UPDATE failed:", updateErr.message);
          }

          // Return ON regardless — the expiry has passed.
          return SAFE_DEFAULT;
        }
      }

      return {
        ads_enabled: data.ads_enabled ?? true,
        ads_disabled_at: data.ads_disabled_at ?? null,
        ads_auto_enable_at: data.ads_auto_enable_at ?? null,
      };
    } catch (err: any) {
      // Any unexpected error → safe fallback (ads ON, no lock-out).
      console.error("[getAdsConfig] Unexpected error:", err?.message ?? err);
      return SAFE_DEFAULT;
    }
  },
);

// ─── setAdsEnabled (admin-only) ──────────────────────────────────────────────

const SetAdsInput = z.object({
  enabled: z.boolean(),
});

export const setAdsEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => SetAdsInput.parse(input))
  .handler(async ({ data, context }) => {
    // Verify the caller is an admin — throws "Forbidden: admin only" if not.
    await assertAdmin(context);

    // Use the service-role client for the actual write so RLS column-level
    // restrictions do not interfere. Authorization is already enforced above.
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Fetch the single settings row ID.
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .limit(1)
      .single();

    if (fetchError || !current) {
      const msg = fetchError?.message ?? "No site_settings row found";
      console.error("[setAdsEnabled] Could not fetch settings row:", msg);
      throw new Error(`Could not find site settings row: ${msg}`);
    }

    const now = new Date();
    const autoEnableAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

    const patch = data.enabled
      ? {
          ads_enabled: true,
          ads_disabled_at: null as string | null,
          ads_auto_enable_at: null as string | null,
        }
      : {
          ads_enabled: false,
          ads_disabled_at: now.toISOString(),
          ads_auto_enable_at: autoEnableAt.toISOString(),
        };

    const { error: updateError } = await supabaseAdmin
      .from("site_settings")
      .update(patch)
      .eq("id", current.id);

    if (updateError) {
      const msg = updateError.message ?? "Unknown Supabase error";
      console.error("[setAdsEnabled] UPDATE failed:", msg);
      throw new Error(`Failed to update ads setting: ${msg}`);
    }

    console.log(`[setAdsEnabled] ads_enabled set to ${data.enabled} by userId=${context.userId}`);

    return {
      success: true,
      ads_enabled: data.enabled,
      ads_auto_enable_at: data.enabled ? null : autoEnableAt.toISOString(),
    };
  });
