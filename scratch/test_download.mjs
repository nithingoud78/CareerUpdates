import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.storage.from("career-tools").createSignedUrl("packs/test/pack.zip", 60, {
    download: '"dMAT - Complete Pack.zip"'
  });
  console.log("With quotes:", data?.signedUrl);
  
  const { data: data2 } = await supabase.storage.from("career-tools").createSignedUrl("packs/test/pack.zip", 60, {
    download: 'dMAT - Complete Pack.zip'
  });
  console.log("Without quotes:", data2?.signedUrl);
}
run();
