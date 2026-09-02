import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
  const { data, error } = await supabase.storage.getBucket('career-tools');
  if (error) {
    console.error("Error getting bucket:", error.message);
  } else {
    console.log("Bucket details:", data);
  }

  const { data: publicUrlData } = supabase.storage.from("career-tools").getPublicUrl("previews/1788337327944-6m3umagi61t.webp");
  console.log("Public URL:", publicUrlData.publicUrl);
  
  try {
    const res = await fetch(publicUrlData.publicUrl);
    console.log("Fetch Status:", res.status);
    console.log("Fetch OK:", res.ok);
  } catch (err) {
    console.error("Fetch failed", err);
  }
}

checkBucket();
