import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  contact_email: z.string().nullable().optional(),
  telegram_url: z.string().nullable().optional(),
  whatsapp_url: z.string().nullable().optional(),
  instagram_url: z.string().nullable().optional(),
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { 
        site_name: "Career Updates",
        contact_email: "careerupdates.in@gmail.com",
        telegram_url: "https://t.me/careerupdate_in",
        whatsapp_url: "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K",
        instagram_url: "https://www.instagram.com/careerupdates_in?igsh=cXp1NTJ4cXZmMW92",
      } as any;
    }
    throw new Error(error.message);
  }

  return data;
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: z.infer<typeof siteSettingsSchema>) => siteSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: current, error: fetchError } = await context.supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .single();

    if (fetchError || !current) {
      throw new Error("Could not find site settings row to update.");
    }

    const { error } = await context.supabase
      .from("site_settings")
      .update(data)
      .eq("id", current.id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });
