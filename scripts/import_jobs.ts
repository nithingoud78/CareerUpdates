import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { extractJobFromUrlInternal } from '../src/lib/ai.functions.ts';
import { upsertJobInternal } from '../src/lib/admin-jobs.functions.ts';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GREENHOUSE_BOARDS = [
  'abnormalsecurity', '6sense', 'hubspot', 'point72', 'diligent', 
  'adyen', 'oportun', 'yipitdata', 'fivetran', 'figma', 'stripe', 
  'plaid', 'instacart', 'doordash', 'airbnb', 'dropbox', 'box', 
  'slack', 'pinterest', 'hashicorp', 'confluent', 'databricks', 
  'mongodb', 'twilio', 'okta', 'zscaler', 'crowdstrike', 'cloudflare', 'gitlab'
];

async function getGreenhouseJobs(board: string) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs
      .filter((j: any) => {
        const loc = j.location?.name?.toLowerCase() || '';
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('delhi') || loc.includes('noida') || loc.includes('chennai') || loc.includes('mumbai') || loc.includes('gurgaon');
      })
      .map((j: any) => j.absolute_url);
  } catch (e) {
    return [];
  }
}

async function run() {
  const { data: userRole } = await supabase.from('user_roles').select('user_id').eq('role', 'admin').limit(1).single();
  const adminId = userRole?.user_id;
  if (!adminId) {
    throw new Error("No admin user found in database!");
  }

  console.log(`Using admin ID: ${adminId}`);
  console.log("Gathering job URLs from Greenhouse APIs...");
  let urls: string[] = [];
  
  for (const board of GREENHOUSE_BOARDS) {
    const boardUrls = await getGreenhouseJobs(board);
    console.log(`- ${board}: found ${boardUrls.length} India jobs`);
    urls.push(...boardUrls);
    if (urls.length >= 60) break;
  }
  
  urls = urls.slice(0, 60);
  console.log(`Total URLs collected: ${urls.length}`);
  
  if (urls.length === 0) {
    console.log("No jobs found, check API or network.");
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n[${i+1}/${urls.length}] Processing: ${url}`);
    try {
      // 1. Extract
      const extracted = await extractJobFromUrlInternal({ url }, supabase);
      
      // 2. Insert as published
      const payload = {
        ...extracted,
        status: 'published',
      };
      
      const result = await upsertJobInternal(payload, supabase, adminId);
      console.log(`✅ Success: ${extracted.title} at ${extracted.company} (${result.action})`);
      successCount++;
    } catch (e: any) {
      console.error(`❌ Failed: ${url}`);
      console.error(e.message);
      failCount++;
    }
  }
  
  console.log(`\nImport complete! Success: ${successCount}, Failed: ${failCount}`);
}

run().catch(console.error);
