import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function checkDB() {
  console.log("Checking Supabase Database...");
  
  // Total jobs
  const { count: totalJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true });
  console.log(`Total jobs in database: ${totalJobs}`);

  // Active (published) jobs
  const { count: activeJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published");
  console.log(`Active (published) jobs: ${activeJobs}`);

  // Draft/Expired jobs
  const { count: draftJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "draft");
  console.log(`Draft/Expired jobs: ${draftJobs}`);

  // Verification status
  const { count: verifiedJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("verification_status", "verified");
  console.log(`Verified jobs: ${verifiedJobs}`);

  // Checking locations for "India"
  const { count: indiaJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).ilike("location", "%India%");
  console.log(`Jobs explicitly mentioning India in location: ${indiaJobs}`);

  // Check new jobs ingested recently (in the last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentJobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).gte("created_at", yesterday);
  console.log(`Jobs created in the last 24 hours: ${recentJobs}`);
}

checkDB().catch(console.error);
