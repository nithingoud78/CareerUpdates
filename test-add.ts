import { supabaseAdmin as supabase } from "./src/integrations/supabase/client.server";

async function main() {
  const workday = {
    company_name: "Atlassian",
    career_url: "https://jobs.lever.co/atlassian",
    platform: "lever",
    enabled: true,
    crawl_frequency: "hourly"
  };

  const greenhouse = {
    company_name: "Figma",
    career_url: "https://boards.greenhouse.io/figma",
    platform: "greenhouse",
    enabled: true,
    crawl_frequency: "hourly"
  };

  await supabase.from("company_sources").insert([workday, greenhouse]);
  console.log("Added Lever and Greenhouse companies");
}

main();
