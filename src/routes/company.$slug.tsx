import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";

import { CompanyLogo } from "@/components/company-logo";

function formatName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchCompanyJobs(slug: string) {
  const companyName = formatName(slug);
  const { data, error } = await supabase
    .from("jobs")
    .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category, employment_type")
    .eq("status", "published")
    .ilike("company", `%${companyName.replace(/ /g, '%')}%`)
    .order("posted_date", { ascending: false });
    
  if (error) throw error;
  
  // Find the most prominent logo
  const logo = data?.find(j => j.company_logo)?.company_logo || null;
  const actualCompanyName = data?.[0]?.company || companyName;

  return { jobs: data ?? [], companyName: actualCompanyName, logo };
}

export const Route = createFileRoute("/company/$slug")({
  loader: async ({ params, context }) => {
    return await context.queryClient.ensureQueryData({
      queryKey: ["company", params.slug],
      queryFn: () => fetchCompanyJobs(params.slug),
    });
  },
  head: ({ params, loaderData }) => {
    const data = loaderData as any;
    const compName = data?.companyName || formatName(params.slug);
    const title = `${compName} Careers & Job Openings in India — Career Updates`;
    const desc = `Browse the latest ${compName} jobs and careers in India. Discover salaries, interview prep, and apply to verified ${compName} roles.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `https://careerupdates.co.in/company/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://careerupdates.co.in/company/${params.slug}` }],
    };
  },
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery({ queryKey: ["company", slug], queryFn: () => fetchCompanyJobs(slug) });
  
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm">
              <CompanyLogo url={data.logo} name={data.companyName} priority />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {data.companyName} Careers
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Discover the latest verified opportunities at {data.companyName} in India.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest Openings at {data.companyName}</h2>
          <span className="text-sm text-muted-foreground">{data.jobs.length} roles found</span>
        </div>
        
        {data.jobs.length === 0 ? (
          <div className="glass mt-6 rounded-2xl p-10 text-center">
            <p className="text-base font-semibold">No active jobs found for {data.companyName}</p>
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
