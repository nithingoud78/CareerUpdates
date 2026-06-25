import { supabaseAdmin as supabase } from "./src/integrations/supabase/client.server";

async function main() {
  const { data, error } = await supabase.from("company_sources").select("company_name, status, enabled");
  console.log("Companies:", data);
  console.log("Error:", error);
}

main();
