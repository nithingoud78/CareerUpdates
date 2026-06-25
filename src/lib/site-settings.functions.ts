import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SiteSettingsInput = z.object({
  contact_email: z.string().email().nullable().optional(),
  telegram_url: z.string().url().nullable().optional().or(z.literal("")),
  whatsapp_url: z.string().url().nullable().optional().or(z.literal("")),
  instagram_url: z.string().url().nullable().optional().or(z.literal("")),
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const getSiteSettings = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    // This is public, so no auth required for GET
    const { data } = await (context as any).supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data;
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => SiteSettingsInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    // Check if row exists
    const { data: existing } = await context.supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: row, error } = await context.supabase
        .from("site_settings")
        .update(data)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    } else {
      const { data: row, error } = await context.supabase
        .from("site_settings")
        .insert(data)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
  });
