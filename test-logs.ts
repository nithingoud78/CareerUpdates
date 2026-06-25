import { supabaseAdmin as supabase } from "./src/integrations/supabase/client.server";

async function main() {
  const { data, error } = await supabase.from("scheduler_logs").select("*");
  console.log("Scheduler Logs:", data);
  console.log("Error:", error);
}

main();
