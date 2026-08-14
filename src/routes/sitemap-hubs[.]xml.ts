import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap-hubs.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let baseUrl = (process.env.SITE_URL || "").trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
        if (!baseUrl || baseUrl.includes("your-production-domain.com")) {
          baseUrl = new URL(request.url).origin;
        }

        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        
        // We'll extract unique categories, companies, and locations from jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("category, company, location")
          .eq("status", "published");
          
        const categories = new Set<string>();
        const companies = new Set<string>();
        const locations = new Set<string>();
        
        if (jobs) {
          jobs.forEach(job => {
             if (job.category) categories.add(job.category.toLowerCase().replace(/ /g, '-'));
             if (job.company) companies.add(job.company.toLowerCase().replace(/ /g, '-'));
             if (job.location) {
               // locations can be comma separated
               job.location.split(',').forEach((loc: string) => {
                 locations.add(loc.trim().toLowerCase().replace(/ /g, '-'));
               });
             }
          });
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...Array.from(categories).map(c => `  <url>\n    <loc>${baseUrl}/category/${c}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`),
          ...Array.from(companies).map(c => `  <url>\n    <loc>${baseUrl}/company/${c}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
          ...Array.from(locations).map(c => `  <url>\n    <loc>${baseUrl}/location/${c}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
