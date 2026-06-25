import { supabaseAdmin } from "./src/integrations/supabase/client.server";

async function updateDb() {
  console.log("Updating site settings...");
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("site_settings")
    .select("id")
    .limit(1)
    .single();

  if (fetchError || !current) {
    console.error("Could not find row:", fetchError);
    return;
  }

  const { error } = await supabaseAdmin
    .from("site_settings")
    .update({
      contact_email: "careerupdates.in@gmail.com",
      telegram_url: "https://t.me/careerupdate_in",
      whatsapp_url: "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K",
      instagram_url: "https://www.instagram.com/careerupdates_in?igsh=cXp1NTJ4cXZmMW92",
    })
    .eq("id", current.id);

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Database updated successfully.");
  }
}

updateDb();
