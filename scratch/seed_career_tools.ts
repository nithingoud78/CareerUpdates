import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabaseUrl = process.env.SUPABASE_URL || "https://bcsoykjrwnrzkqacnkgr.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Seeding demo data for career tools...");

  const dummyFileContent = "This is a dummy template file for testing purposes.";
  const dummyFileName = "seed/dummy-template.txt";
  await supabase.storage.from("career-tools").upload(dummyFileName, dummyFileContent, { contentType: "text/plain", upsert: true });

  const dummyImage = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80";

  const r1 = await supabase.from("career_tool_products").upsert({
    slug: "clean-professional-resume",
    title: "Clean Professional Resume",
    short_description: "Minimalist ATS-friendly layout",
    product_type: "single_template",
    resource_type: "resume",
    status: "published",
    original_price: 299,
    current_price: 29,
    pinned: true,
    category: "Professional",
    file_format: "DOCX",
    preview_image_url: dummyImage,
    file_url: dummyFileName,
  }, { onConflict: "slug" }).select("id").single();

  const r2 = await supabase.from("career_tool_products").upsert({
    slug: "modern-fresher-resume",
    title: "Modern Fresher Resume",
    short_description: "Clean two-column light template",
    product_type: "single_template",
    resource_type: "resume",
    status: "published",
    original_price: 199,
    current_price: 19,
    category: "Fresher",
    file_format: "DOCX",
    preview_image_url: dummyImage,
    file_url: dummyFileName,
  }, { onConflict: "slug" }).select("id").single();

  const cl1 = await supabase.from("career_tool_products").upsert({
    slug: "standard-cover-letter",
    title: "Standard Cover Letter",
    short_description: "Universal cover letter template",
    product_type: "single_template",
    resource_type: "cover_letter",
    status: "published",
    original_price: 99,
    current_price: 9,
    category: "Cover Letter",
    file_format: "DOCX",
    preview_image_url: dummyImage,
    file_url: dummyFileName,
  }, { onConflict: "slug" }).select("id").single();

  const ref1 = await supabase.from("career_tool_products").upsert({
    slug: "referral-message-template",
    title: "LinkedIn Referral Message",
    short_description: "High-conversion referral request",
    product_type: "single_template",
    resource_type: "referral_message",
    status: "published",
    original_price: 49,
    current_price: 0,
    category: "Outreach",
    file_format: "TXT",
    preview_image_url: dummyImage,
    file_url: dummyFileName,
  }, { onConflict: "slug" }).select("id").single();

  const cold1 = await supabase.from("career_tool_products").upsert({
    slug: "cold-email-template",
    title: "Hiring Manager Cold Email",
    short_description: "Get noticed by decision makers",
    product_type: "single_template",
    resource_type: "cold_email",
    status: "published",
    original_price: 49,
    current_price: 0,
    category: "Outreach",
    file_format: "TXT",
    preview_image_url: dummyImage,
    file_url: dummyFileName,
  }, { onConflict: "slug" }).select("id").single();

  const b1 = await supabase.from("career_tool_products").upsert({
    slug: "complete-job-application-bundle",
    title: "Complete Job Application Bundle",
    short_description: "2 Resumes + 1 Cover Letter template",
    product_type: "bundle",
    resource_type: "resume",
    status: "published",
    original_price: 599,
    current_price: 49,
    category: "Bundle",
    preview_image_url: dummyImage,
  }, { onConflict: "slug" }).select("id").single();

  const b2 = await supabase.from("career_tool_products").upsert({
    slug: "campus-placement-bundle",
    title: "Campus Placement Bundle",
    short_description: "Resume + Referral Message + Cold Email",
    product_type: "bundle",
    resource_type: "resume",
    status: "published",
    original_price: 499,
    current_price: 39,
    category: "Bundle",
    preview_image_url: dummyImage,
  }, { onConflict: "slug" }).select("id").single();

  if (b1.data && r1.data && r2.data && cl1.data) {
    await supabase.from("bundle_resources").delete().eq("bundle_product_id", b1.data.id);
    await supabase.from("bundle_resources").insert([
      { bundle_product_id: b1.data.id, resource_product_id: r1.data.id, sort_order: 0 },
      { bundle_product_id: b1.data.id, resource_product_id: r2.data.id, sort_order: 1 },
      { bundle_product_id: b1.data.id, resource_product_id: cl1.data.id, sort_order: 2 },
    ]);
  }

  if (b2.data && r1.data && ref1.data && cold1.data) {
    await supabase.from("bundle_resources").delete().eq("bundle_product_id", b2.data.id);
    await supabase.from("bundle_resources").insert([
      { bundle_product_id: b2.data.id, resource_product_id: r1.data.id, sort_order: 0 },
      { bundle_product_id: b2.data.id, resource_product_id: ref1.data.id, sort_order: 1 },
      { bundle_product_id: b2.data.id, resource_product_id: cold1.data.id, sort_order: 2 },
    ]);
  }

  console.log("Seed data applied successfully");
}

main().catch(console.error);
