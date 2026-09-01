import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumn() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE public.career_tool_products ADD COLUMN IF NOT EXISTS download_file_name TEXT NULL;' });
  if (error) {
    console.error("RPC error (maybe exec_sql doesn't exist?):", error);
  } else {
    console.log("Column added via RPC:", data);
  }
}

addColumn();
