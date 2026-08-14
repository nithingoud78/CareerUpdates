import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import TurndownService from 'turndown';
import { upsertJobInternal } from '../src/lib/admin-jobs.functions.ts';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const turndownService = new TurndownService();

// More exhaustive ATS board lists
const GREENHOUSE_BOARDS = [
  'abnormalsecurity', '6sense', 'hubspot', 'point72', 'diligent', 
  'adyen', 'oportun', 'yipitdata', 'fivetran', 'figma', 'stripe', 
  'plaid', 'instacart', 'doordash', 'airbnb', 'dropbox', 'box', 
  'slack', 'pinterest', 'hashicorp', 'confluent', 'databricks', 
  'mongodb', 'twilio', 'okta', 'zscaler', 'crowdstrike', 'cloudflare', 'gitlab',
  'datadog', 'rubrik', 'canva', 'brex', 'ramp', 'notion', 'thoughtspot', 'roblox',
  'coinbase', 'robinhood', 'plaid', 'zoom', 'atlassian', 'snowflake'
];

const LEVER_BOARDS = [
  'netflix', 'atlassian', 'coursera', 'yelp', 'eventbrite', 'lyft', 'reddit', 'quora', 'spotify',
  'kPMG', 'ncr'
];

function isIndian(loc: string) {
  if (!loc) return false;
  const l = loc.toLowerCase();
  return l.includes('india') || l.includes('bangalore') || l.includes('bengaluru') || 
         l.includes('hyderabad') || l.includes('pune') || l.includes('delhi') || 
         l.includes('noida') || l.includes('chennai') || l.includes('mumbai') || 
         l.includes('gurgaon') || l.includes('ahmedabad') || l.includes('kochi') ||
         l.includes('chandigarh') || l.includes('remote - in');
}

function classifyJob(title: string, desc: string) {
  const t = (title + ' ' + desc).toLowerCase();
  
  let experience = "Not Mentioned";
  if (t.includes('fresher') || t.includes('0-1 year') || t.includes('0-2 year') || t.includes('entry level') || t.includes('new grad')) {
    experience = '0-2 years (Entry Level)';
  } else if (t.match(/\b([1-3])\+?\s*years?\b/)) {
    experience = '1-3 years';
  } else if (t.match(/\b([3-5])\+?\s*years?\b/)) {
    experience = '3-5 years';
  } else if (t.match(/\b([5-9]|10)\+?\s*years?\b/)) {
    experience = '5+ years (Senior)';
  }

  let employment_type = "Full-time";
  if (t.includes('intern') || t.includes('internship')) employment_type = 'Internship';
  else if (t.includes('contract')) employment_type = 'Contract';
  else if (t.includes('part-time')) employment_type = 'Part-time';

  let qualification = "Not Mentioned";
  if (t.includes('b.tech') || t.includes('btech') || t.includes('b.e') || t.includes('bachelor')) qualification = "Bachelor's Degree";
  else if (t.includes('m.tech') || t.includes('master')) qualification = "Master's Degree";
  else if (t.includes('mba')) qualification = "MBA";
  else if (t.includes('mca')) qualification = "MCA";

  let category = "IT";
  let subcategory = "General";
  
  if (t.includes('software') || t.includes('developer') || t.includes('engineer') || t.includes('programmer')) {
    subcategory = 'Software Engineering';
  } else if (t.includes('data') || t.includes('machine learning') || t.includes('ai')) {
    subcategory = 'Data Science';
  } else if (t.includes('sales') || t.includes('marketing') || t.includes('business')) {
    category = 'Business';
    subcategory = 'Sales & Marketing';
  } else if (t.includes('hr') || t.includes('human resources')) {
    category = 'Business';
    subcategory = 'HR';
  }

  return { experience, employment_type, qualification, category, subcategory };
}

function generateSlug(company: string, title: string) {
  const s = `${company}-${title}-${Math.floor(Math.random()*10000)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s.slice(0, 100);
}

async function getGreenhouseJobs(board: string) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs
      .filter((j: any) => isIndian(j.location?.name))
      .map((j: any) => {
        const descMarkdown = turndownService.turndown(j.content || '');
        const classifications = classifyJob(j.title, descMarkdown);
        return {
          title: j.title,
          company: board.charAt(0).toUpperCase() + board.slice(1),
          location: j.location?.name,
          apply_url: j.absolute_url,
          description: descMarkdown,
          company_logo: `https://logo.clearbit.com/${board}.com`,
          ...classifications,
          slug: generateSlug(board, j.title)
        };
      });
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
      .filter((j: any) => isIndian(j.categories?.location))
      .map((j: any) => {
        const content = j.descriptionPlain || j.description || '';
        const classifications = classifyJob(j.text, content);
        return {
          title: j.text,
          company: board.charAt(0).toUpperCase() + board.slice(1),
          location: j.categories?.location,
          apply_url: j.hostedUrl,
          description: content,
          company_logo: `https://logo.clearbit.com/${board}.com`,
          ...classifications,
          slug: generateSlug(board, j.text)
        };
      });
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

  let allJobs: any[] = [];
  
  console.log("Fetching Greenhouse jobs...");
  for (const board of GREENHOUSE_BOARDS) {
    const jobs = await getGreenhouseJobs(board);
    console.log(`- Greenhouse ${board}: found ${jobs.length} India jobs`);
    allJobs.push(...jobs);
  }

  console.log("Fetching Lever jobs...");
  for (const board of LEVER_BOARDS) {
    const jobs = await getLeverJobs(board);
    console.log(`- Lever ${board}: found ${jobs.length} India jobs`);
    allJobs.push(...jobs);
  }
  
  console.log(`Total jobs collected: ${allJobs.length}`);
  
  let successCount = 0;
  let failCount = 0;
  let duplicateCount = 0;

  // Cache existing URLs to avoid duplicate inserts
  const { data: existingJobs } = await supabase.from('jobs').select('apply_url');
  const existingUrls = new Set(existingJobs?.map(j => j.apply_url) || []);

  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
    
    if (existingUrls.has(job.apply_url)) {
      duplicateCount++;
      continue;
    }

    try {
      const payload = {
        ...job,
        status: 'published',
        salary: 'Not Mentioned',
        meta_description: '',
        ai_summary: '',
        tags: []
      };
      
      const { error } = await supabase.from('jobs').insert([
        { ...payload, created_by: adminId }
      ]);
      
      if (error) {
        if (error.code === '23505') { // Unique violation (slug/url)
           duplicateCount++;
        } else {
           console.error(`❌ Failed: ${job.title} at ${job.company} - ${error.message}`);
           failCount++;
        }
      } else {
        successCount++;
        existingUrls.add(job.apply_url);
        if (successCount % 50 === 0) {
          console.log(`Progress: Imported ${successCount} jobs...`);
        }
      }
    } catch (e: any) {
      console.error(`❌ Exception for: ${job.title} - ${e.message}`);
      failCount++;
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Discovered: ${allJobs.length}`);
  console.log(`Imported: ${successCount}`);
  console.log(`Skipped (Duplicates): ${duplicateCount}`);
  console.log(`Failed: ${failCount}`);
}

run().catch(console.error);
