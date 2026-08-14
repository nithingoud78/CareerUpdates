import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  const { count: total } = await supabase.from("jobs").select("*", { count: "exact", head: true });
  const { count: published } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published");
  const { count: draft } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "draft");
  const { count: verified } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("verification_status", "verified");
  const { count: indian } = await supabase.from("jobs").select("*", { count: "exact", head: true }).ilike("location", "%India%");
  
  console.log(`DATABASE:`);
  console.log(`Total jobs: ${total}`);
  console.log(`Published: ${published}`);
  console.log(`Active (same as published usually): ${published}`);
  console.log(`Indian: ${indian}`);
  console.log(`Verified: ${verified}`);
  
  // Category counts
  const categories = ["IT", "Engineering", "ECE/Embedded", "Internships", "Business", "Government", "Other"];
  console.log(`\nCATEGORIES:`);
  for (const c of categories) {
    const { count } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published").ilike("category", `%${c}%`);
    console.log(`${c}: ${count}`);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
