import { supabaseAdmin as supabase } from "./src/integrations/supabase/client.server";

async function main() {
  const { data, error } = await supabase.from("jobs").select("id, title, company").limit(5);
  console.log("Jobs:", data);
}
main();
