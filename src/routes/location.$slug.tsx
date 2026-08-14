import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { AdSlot } from "@/components/ad-slot";

function formatName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchLocationJobs(slug: string) {
  const locationName = formatName(slug);
  const { data, error } = await supabase
    .from("jobs")
    .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category, employment_type")
    .eq("status", "published")
    .ilike("location", `%${locationName}%`)
    .order("posted_date", { ascending: false });
    
  if (error) throw error;
  return { jobs: data ?? [], locationName };
}

export const Route = createFileRoute("/location/$slug")({
  loader: async ({ params, context }) => {
    return await context.queryClient.ensureQueryData({
      queryKey: ["location", params.slug],
      queryFn: () => fetchLocationJobs(params.slug),
    });
  },
  head: ({ params, loaderData }) => {
    const data = loaderData as any;
    const locName = data?.locationName || formatName(params.slug);
    const title = `Jobs in ${locName} — Latest Openings | Career Updates`;
    const desc = `Browse the latest jobs and careers in ${locName}. Apply to verified roles in ${locName} across IT, Government, and Business sectors.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `https://careerupdates.co.in/location/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://careerupdates.co.in/location/${params.slug}` }],
    };
  },
  component: LocationPage,
});

function LocationPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery({ queryKey: ["location", slug], queryFn: () => fetchLocationJobs(slug) });
  
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Jobs in {data.locationName}
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Discover the latest verified opportunities in {data.locationName}. We actively source and verify the best roles to help you advance your career.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdSlot label="Advertisement" />
        
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest {data.locationName} Openings</h2>
          <span className="text-sm text-muted-foreground">{data.jobs.length} roles found</span>
        </div>
        
        {data.jobs.length === 0 ? (
          <div className="glass mt-6 rounded-2xl p-10 text-center">
            <p className="text-base font-semibold">No jobs found in {data.locationName} right now</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later or browse all jobs.</p>
            <Link to="/search" className="mt-4 inline-block text-brand hover:underline">View all jobs &rarr;</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
