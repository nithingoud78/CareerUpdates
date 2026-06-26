// @ts-ignore
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabase } from "@/integrations/supabase/client";

export const APIRoute = createAPIFileRoute("/api/sitemap.xml")({
  GET: async () => {
    // Fetch all published jobs
    const { data: jobs } = (await supabase
      .from("jobs")
      .select("slug, updated_at")
      .eq("status", "published")) as { data: any[] | null };

    // Fetch all published blog posts
    const { data: blogs } = (await supabase
      .from("blogs")
      .select("slug, updated_at")
      .eq("status", "published")) as { data: any[] | null };

    const baseUrl = "https://careerupdates.app";

    const urls = [
      { loc: baseUrl, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/search`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/blog`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/about`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/contact`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/privacy`, lastmod: new Date().toISOString() },
    ];

    if (jobs) {
      jobs.forEach((job) => {
        urls.push({
          loc: `${baseUrl}/jobs/${job.slug}`,
          lastmod: new Date(job.updated_at).toISOString(),
        });
      });
    }

    if (blogs) {
      blogs.forEach((blog) => {
        urls.push({
          loc: `${baseUrl}/blog/${blog.slug}`,
          lastmod: new Date(blog.updated_at).toISOString(),
        });
      });
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`
    )
    .join("")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  },
});
