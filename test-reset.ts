import { supabaseAdmin as supabase } from "./src/integrations/supabase/client.server";

async function main() {
  await supabase.from("company_sources").update({ status: "idle" }).neq("status", "idle");
  console.log("Reset completed");
}
main();
