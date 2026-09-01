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
  openrouter: "google/gemini-flash-1.5",
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
      .select("id, provider, model, base_url, api_key, is_active, created_at, updated_at")
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
    };
  });

// ─── Admin: save ATS settings ─────────────────────────────────────────────────

export const saveAtsSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => AtsSettingsInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Deactivate previous active record
    await context.supabase
      .from("ats_settings")
      .update({ is_active: false })
      .eq("is_active", true);

    // Get existing key if not providing a new one
    let apiKey = data.api_key || null;

    const { data: row, error } = await context.supabase
      .from("ats_settings")
      .insert({
        provider: data.provider,
        model: data.model,
        base_url: data.base_url || null,
        api_key: apiKey,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

// ─── Admin: test ATS connection ───────────────────────────────────────────────

export const checkAtsHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data: settings } = await context.supabase
      .from("ats_settings")
      .select("provider, model, base_url, api_key")
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
        if (resp.status === 401) return { status: "Invalid Key", error: "Invalid API key." };
        if (resp.status === 429) return { status: "Rate Limited", error: "Rate limited by Anthropic. Try again later." };
        if (!resp.ok) return { status: "Unavailable", error: `Provider responded with ${resp.status}` };
        return { status: "Connected", provider: settings.provider, model: settings.model };
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
            max_tokens: 10,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (resp.status === 401 || resp.status === 403)
          return { status: "Invalid Key", error: "Invalid API key." };
        if (resp.status === 429) {
          return { 
            status: "Rate Limited", 
            error: isOpenRouter 
              ? "OpenRouter is configured, but this model is currently rate-limited. Try another model." 
              : "Rate limited by provider. Try again later." 
          };
        }
        if (!resp.ok) return { status: "Unavailable", error: `Provider responded with ${resp.status}` };
        return { status: "Connected", provider: settings.provider, model: settings.model };
      }
    } catch (err: any) {
      if (err.name === "TimeoutError") return { status: "Unavailable", error: "Connection timed out." };
      return { status: "Unavailable", error: "Could not reach provider." };
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
