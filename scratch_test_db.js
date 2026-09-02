import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("ats_settings")
    .select("connection_status, last_tested_at, last_success_at, last_error, last_tested_provider, last_tested_model")
    .eq("is_active", true);

  if (error) {
    console.error("Error querying:", error);
    process.exit(1);
  }
  
  console.log("Data:", data);
}

main();
