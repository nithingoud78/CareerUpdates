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
  'mongodb', 'twilio', 'okta', 'zscaler', 'crowdstrike', 'cloudflare', 'gitlab',
  'datadog', 'rubrik', 'canva', 'brex', 'ramp', 'notion', 'thoughtspot', 'roblox'
];

const LEVER_BOARDS = [
  'netflix', 'atlassian', 'coursera', 'yelp', 'eventbrite', 'lyft', 'reddit', 'quora', 'spotify'
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

async function getLeverJobs(board: string) {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`);
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter((j: any) => {
        const loc = j.categories?.location?.toLowerCase() || '';
        return loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('hyderabad') || loc.includes('pune') || loc.includes('delhi') || loc.includes('noida') || loc.includes('chennai') || loc.includes('mumbai') || loc.includes('gurgaon');
      })
      .map((j: any) => j.hostedUrl);
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
  let urls: string[] = [];
  
  for (const board of GREENHOUSE_BOARDS) {
    const boardUrls = await getGreenhouseJobs(board);
    console.log(`- Greenhouse ${board}: found ${boardUrls.length} India jobs`);
    urls.push(...boardUrls);
  }

  for (const board of LEVER_BOARDS) {
    const boardUrls = await getLeverJobs(board);
    console.log(`- Lever ${board}: found ${boardUrls.length} India jobs`);
    urls.push(...boardUrls);
  }
  
  // Cap to 30 to avoid severe rate limits and complete within reasonable time
  urls = urls.slice(0, 30);
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
    
    // Throttling to respect 15 RPM limit
    // We wait 6000ms before processing to be safe.
    await new Promise(r => setTimeout(r, 6000));

    let retryCount = 0;
    while (retryCount < 3) {
      try {
        const extracted = await extractJobFromUrlInternal({ url }, supabase);
        
        const payload = {
          ...extracted,
          status: 'published',
        };
        
        const result = await upsertJobInternal(payload, supabase, adminId);
        console.log(`✅ Success: ${extracted.title} at ${extracted.company} (${result.action})`);
        successCount++;
        break; // break out of retry loop
      } catch (e: any) {
        console.error(`❌ Attempt ${retryCount + 1} Failed for: ${url}`);
        console.error(e.message);
        
        if (e.message.includes('429') || e.message.includes('Rate limit') || e.message.includes('quota')) {
          console.log(`Rate limit hit in top loop. Waiting 35 seconds before retrying...`);
          await new Promise(r => setTimeout(r, 35000));
          retryCount++;
        } else {
          // If it's a parsing error or something else, skip it.
          failCount++;
          break;
        }
      }
    }
    
    if (retryCount >= 3) {
      console.log(`Skipping ${url} after 3 rate limit failures.`);
      failCount++;
    }
  }
  
  console.log(`\nImport complete! Success: ${successCount}, Failed: ${failCount}`);
}

run().catch(console.error);
