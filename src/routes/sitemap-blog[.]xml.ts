import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap-blog.xml")({
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
        
        let allBlogs: any[] = [];
        let from = 0;
        const step = 1000;

        while (true) {
          const { data } = await supabase
            .from("blogs")
            .select("slug, updated_at")
            .eq("status", "published")
            .order("updated_at", { ascending: false })
            .range(from, from + step - 1);
            
          if (!data || data.length === 0) break;
          allBlogs.push(...data);
          if (data.length < step) break;
          from += step;
        }

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...allBlogs.map((b) => {
            const lastmod = b.updated_at ? new Date(b.updated_at).toISOString().split('T')[0] : "";
            return [
              `  <url>`,
              `    <loc>${baseUrl}/blog/${b.slug}</loc>`,
              lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
              `    <changefreq>weekly</changefreq>`,
              `    <priority>0.7</priority>`,
              `  </url>`,
            ].filter(Boolean).join("\n");
          }),
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
