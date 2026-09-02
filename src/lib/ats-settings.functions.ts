/**
 * ATS SETTINGS FUNCTIONS
 *
 * IMPORTANT: This module is COMPLETELY ISOLATED from ai-settings.functions.ts
 * and ai.functions.ts which are used for job extraction / content generation.
 *
 * The ATS checker has its OWN configuration stored in the `ats_settings` table.
 * Changing ATS settings will NOT affect global AI settings and vice versa.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ATS-specific provider list — separate from global AI providers
export const ATS_PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "openai_compatible", label: "OpenAI-compatible API" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom Provider" },
] as const;

export const ATS_DEFAULT_URLS: Record<string, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openai: "https://api.openai.com/v1",
  openai_compatible: "",
  anthropic: "https://api.anthropic.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  custom: "",
};

export const ATS_DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash",
  openai: "gpt-4o-mini",
  openai_compatible: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  openrouter: "google/gemini-1.5-flash",
  custom: "",
};

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

const AtsSettingsInput = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  base_url: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
});

// ─── Admin: get ATS settings ──────────────────────────────────────────────────

export const getAtsSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("ats_settings")
      .select("id, provider, model, base_url, api_key, is_active, created_at, updated_at, original_price, current_price, connection_status, last_tested_at, last_success_at, last_error, last_tested_provider, last_tested_model")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // Return without exposing full api_key: just indicate if key exists
    if (!data) return null;
    return {
      ...data,
      api_key: data.api_key ? "••••••••" : null,
      _has_api_key: !!data.api_key,
      is_free: data.current_price != null && data.current_price < 0,
      actual_price: data.current_price != null ? Math.abs(data.current_price) : 5,
    };
  });

// ─── Admin: save ATS settings ─────────────────────────────────────────────────

export const saveAtsSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AtsSettingsInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Fetch previous active record FIRST
    const { data: previous } = await context.supabase
      .from("ats_settings")
      .select("api_key, current_price, original_price, connection_status, last_tested_at, last_success_at, last_error")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    // Deactivate previous active record
    await context.supabase
      .from("ats_settings")
      .update({ is_active: false })
      .eq("is_active", true);

    // Get existing key if not providing a new one
    let apiKey = data.api_key || null;
    if (!apiKey && previous?.api_key) {
      apiKey = previous.api_key;
    }

    const { data: row, error } = await context.supabase
      .from("ats_settings")
      .insert({
        provider: data.provider,
        model: data.model,
        base_url: data.base_url || null,
        api_key: apiKey,
        is_active: true,
        current_price: previous?.current_price ?? 5,
        original_price: previous?.original_price ?? 299,
        connection_status: previous?.connection_status ?? null,
        last_tested_at: previous?.last_tested_at ?? null,
        last_success_at: previous?.last_success_at ?? null,
        last_error: previous?.last_error ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

// ─── Admin: save ATS pricing ──────────────────────────────────────────────────

const AtsPricingInput = z.object({
  price: z.number().min(1),
  original_price: z.number().min(1),
  is_free: z.boolean(),
});

export const saveAtsPricingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AtsPricingInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    // Convert is_free to a negative current_price
    const finalPrice = data.is_free ? -Math.abs(data.price) : Math.abs(data.price);

    const { error } = await context.supabase
      .from("ats_settings")
      .update({ 
        current_price: finalPrice,
        original_price: data.original_price
      })
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Admin: test ATS connection ───────────────────────────────────────────────

export const checkAtsHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data: settings } = await context.supabase
      .from("ats_settings")
      .select("id, provider, model, base_url, api_key")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!settings) {
      return { status: "Not Configured", error: "No ATS provider configured yet." };
    }
    if (!settings.api_key) {
      return { status: "Not Configured", error: "API key not set." };
    }

    const baseUrl = settings.base_url || ATS_DEFAULT_URLS[settings.provider] || "https://api.openai.com/v1";

    try {
      const isAnthropic = settings.provider === "anthropic";

      let status = "Unknown";
      let errorMsg = null;
      let respOk = false;

      if (isAnthropic) {
        // Anthropic uses a different API format
        const resp = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": settings.api_key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 10,
            messages: [{ role: "user", content: "Hello" }],
          }),
          signal: AbortSignal.timeout(10000),
        });
        
        if (resp.status === 401) {
          status = "Invalid Key"; errorMsg = "Invalid API key.";
        } else if (resp.status === 429) {
          status = "Rate Limited"; errorMsg = "Rate limited by Anthropic. Try again later.";
        } else if (!resp.ok) {
          status = "Unavailable"; errorMsg = `Provider responded with ${resp.status} - ${await resp.text()}`;
        } else {
          status = "Connected"; respOk = true;
        }
      } else {
        // OpenAI-compatible
        const isOpenRouter = settings.provider === "openrouter";
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.api_key}`,
            ...(isOpenRouter && {
              "HTTP-Referer": "https://careerupdates.co.in",
              "X-Title": "Career Updates ATS Checker",
            }),
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [{ role: "user", content: "Hello" }],
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (resp.status === 401 || resp.status === 403) {
          status = "Invalid Key"; errorMsg = "Invalid API key.";
        } else if (resp.status === 429) {
          status = "Rate Limited"; 
          errorMsg = isOpenRouter ? "OpenRouter is configured, but this model is currently rate-limited. Try another model." : "Rate limited by provider. Try again later.";
        } else if (!resp.ok) {
          status = "Unavailable"; errorMsg = `Provider responded with ${resp.status} - ${await resp.text()}`;
        } else {
          status = "Connected"; respOk = true;
        }
      }

      const currentIsoTime = new Date().toISOString();
      const statusValue = respOk ? "success" : "error";

      // Persist the real connection status
      await context.supabase
        .from("ats_settings")
        .update({
          connection_status: statusValue,
          last_error: errorMsg,
          last_tested_at: currentIsoTime,
          last_tested_provider: settings.provider,
          last_tested_model: settings.model,
          ...(respOk && { last_success_at: currentIsoTime }),
        })
        .eq("id", settings.id);

      return { 
        status: statusValue, 
        error: errorMsg,
        provider: settings.provider,
        model: settings.model,
        timestamp: currentIsoTime
      };
    } catch (err: any) {
      const errorMsg = err.name === "TimeoutError" ? "Connection timed out." : "Could not reach provider.";
      const currentIsoTime = new Date().toISOString();

      await context.supabase
        .from("ats_settings")
        .update({
          connection_status: "error",
          last_error: errorMsg,
          last_tested_at: currentIsoTime,
          last_tested_provider: settings.provider,
          last_tested_model: settings.model,
        })
        .eq("id", settings.id);
        
      return { 
        status: "error", 
        error: errorMsg,
        provider: settings.provider,
        model: settings.model,
        timestamp: currentIsoTime
      };
    }
  });

// ─── Internal: get ATS provider config (used by ats-checker.functions.ts) ─────
// NOT exported as a server function — internal use only

export async function getAtsProviderConfig(supabaseClient: any): Promise<{
  provider: string;
  model: string;
  baseUrl: string;
  headers: Record<string, string>;
  isAnthropic: boolean;
}> {
  const { data } = await supabaseClient
    .from("ats_settings")
    .select("provider, model, base_url, api_key")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !data.api_key) {
    throw new Error("ATS checker is not configured. Please configure the ATS provider in admin settings.");
  }

  const baseUrl = data.base_url || ATS_DEFAULT_URLS[data.provider] || "https://api.openai.com/v1";
  const isAnthropic = data.provider === "anthropic";

  const isOpenRouter = data.provider === "openrouter";

  return {
    provider: data.provider,
    model: data.model,
    baseUrl,
    isAnthropic,
    headers: isAnthropic
      ? {
          "Content-Type": "application/json",
          "x-api-key": data.api_key,
          "anthropic-version": "2023-06-01",
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.api_key}`,
          ...(isOpenRouter && {
            "HTTP-Referer": "https://careerupdates.co.in",
            "X-Title": "Career Updates ATS Checker",
          }),
        },
  };
}
