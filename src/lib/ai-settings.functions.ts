import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SettingsInput = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  base_url: z.string().nullable().optional(),
  api_key: z.string().nullable().optional(),
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getAiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("ai_settings")
      .select("id, provider, model, base_url, api_key, is_active, created_at, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const saveAiSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => SettingsInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Deactivate previous, insert new active
    await context.supabase.from("ai_settings").update({ is_active: false }).eq("is_active", true);
    const { data: row, error } = await context.supabase
      .from("ai_settings")
      .insert({ ...data, is_active: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
