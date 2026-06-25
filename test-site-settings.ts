import { supabaseAdmin } from "./src/integrations/supabase/client.server";

async function test() {
  console.log("Fetching site settings...");
  const { data, error } = await supabaseAdmin.from("site_settings").select("*").single();
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}

test();
