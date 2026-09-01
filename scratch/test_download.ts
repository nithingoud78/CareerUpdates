import { config } from "dotenv";
config();
import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const slug = "clean-professional-resume";
    const { data: product } = await supabase
      .from("career_tool_products")
      .select("id, title, file_url, download_file_name")
      .eq("slug", slug)
      .single();

    console.log("3. Creating signed URL with 'career-tools'...");
    const { data: urlData, error: urlError } = await supabase.storage
      .from("career-tools")
      .createSignedUrl(product.file_url, 60, {
        download: product.download_file_name || true,
      });

    if (urlError) {
      console.error("createSignedUrl failed:", urlError);
    } else {
      console.log("Signed URL created:", urlData?.signedUrl);
    }
  } catch (err: any) {
    console.error("UNEXPECTED ERROR:", err);
  }
}

run();
