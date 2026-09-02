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

async function inspectImages() {
  const { data, error } = await supabase
    .from("career_tool_products")
    .select("id, title, product_type, preview_image_url")
    .limit(20);

  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  console.log("--- Preview Image URLs ---");
  data.forEach((row) => {
    console.log(`[${row.product_type}] ${row.title}: ${row.preview_image_url}`);
  });
}

inspectImages();
