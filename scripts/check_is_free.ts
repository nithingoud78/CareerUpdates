import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function checkIsFree() {
  console.log("Checking if is_free column exists...");
  const { data, error } = await supabase
    .from("career_tool_products")
    .select("id, is_free")
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

checkIsFree().catch(console.error);
