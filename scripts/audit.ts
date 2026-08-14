import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log("=== DB AUDIT ===");
  
  const { data: allJobs, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error("Error fetching jobs:", error);
    return;
  }
  
  if (!allJobs) return;
  
  const total = allJobs.length;
  const published = allJobs.filter(j => j.status === 'published').length;
  
  // Indian logic: country = India, or location includes india/bangalore/etc.
  const isIndian = (j: any) => {
    const loc = (j.location || '').toLowerCase();
    const ctry = (j.country || '').toLowerCase();
    if (ctry === 'india' || ctry === 'in') return true;
    if (loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || 
        loc.includes('hyderabad') || loc.includes('pune') || loc.includes('mumbai') || 
        loc.includes('delhi') || loc.includes('chennai') || loc.includes('noida') || 
        loc.includes('gurgaon') || loc.includes('ahmedabad') || loc.includes('kochi') ||
        loc.includes('chandigarh') || loc.includes('remote - in')) {
      return true;
    }
    return false;
  };
  
  const indian = allJobs.filter(isIndian).length;
  const nonIndian = total - indian;
  
  const expired = allJobs.filter(j => j.last_date && new Date(j.last_date) < new Date()).length;
  
  const missingAppUrl = allJobs.filter(j => !j.apply_url).length;
  const missingCompany = allJobs.filter(j => !j.company).length;
  const missingLocation = allJobs.filter(j => !j.location && !j.country).length;
  const missingDesc = allJobs.filter(j => !j.description).length;
  
  // Check duplicates by URL
  const urls = allJobs.map(j => j.apply_url).filter(Boolean);
  const uniqueUrls = new Set(urls);
  const duplicates = urls.length - uniqueUrls.size;

  console.log(`Total: ${total}`);
  console.log(`Published: ${published}`);
  console.log(`Indian: ${indian}`);
  console.log(`Non-Indian: ${nonIndian}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Expired: ${expired}`);
  console.log(`Missing application URL: ${missingAppUrl}`);
  console.log(`Missing company: ${missingCompany}`);
  console.log(`Missing location: ${missingLocation}`);
  console.log(`Missing description: ${missingDesc}`);
}

run();
