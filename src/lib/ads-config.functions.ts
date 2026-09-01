import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

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
      // Use the standard client (anon). RLS allows public SELECT on site_settings.
      const { data, error } = await supabase
        .from("site_settings")
        .select("ads_enabled, ads_disabled_at, ads_auto_enable_at")
        .limit(1)
        .single();

      if (error || !data) {
        // Safe fallback: DB unavailable → assume ads are ON.
        console.error("[getAdsConfig] DB error, returning safe fallback:", error?.message);
        return SAFE_DEFAULT;
      }

      // ── Automatic re-enable check ─────────────────────────────────────────
      // If ads_enabled = false AND ads_auto_enable_at has passed,
      // we logically treat ads as ON. 
      // We also attempt an opportunistic UPDATE to clean up the DB state.
      // We use the SECURITY DEFINER RPC auto_enable_ads() so anonymous users
      // can trigger this without needing the service role key or bypassing RLS directly.
      if (data.ads_enabled === false && data.ads_auto_enable_at) {
        const now = new Date();
        const autoEnableAt = new Date(data.ads_auto_enable_at);

        if (now >= autoEnableAt) {
          // Attempt opportunistic update via RPC
          const { error: updateErr } = await supabase.rpc("auto_enable_ads");

          if (updateErr) {
            console.warn("[getAdsConfig] Opportunistic auto-re-enable RPC failed:", updateErr.message);
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

    // Use the user-authenticated client from context.
    // RLS will permit this because assertAdmin ensures the user is an admin.
    const authenticatedClient = context.supabase;

    // Fetch the single settings row ID.
    const { data: current, error: fetchError } = await authenticatedClient
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

    const { error: updateError } = await authenticatedClient
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
