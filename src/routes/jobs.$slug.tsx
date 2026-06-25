import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Calendar,
  ExternalLink,
  GraduationCap,
  MapPin,
  Wallet,
} from "lucide-react";
import { marked } from "marked";
import { supabase } from "@/integrations/supabase/client";

marked.setOptions({ gfm: true, breaks: true });
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdSlot } from "@/components/ad-slot";
import { StickySocial } from "@/components/sticky-social";
import { JobCard } from "@/components/job-card";
import { CompanyLogo } from "@/components/company-logo";

async function fetchJob(slug: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  const { data: related } = await supabase
    .from("jobs")
    .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category")
    .eq("status", "published")
    .neq("id", data.id)
    .eq("category", data.category ?? "IT")
    .limit(4);
  return { job: data, related: related ?? [] };
}

export const Route = createFileRoute("/jobs/$slug")({
  loader: async ({ params, context }) => {
    return await context.queryClient.ensureQueryData({
      queryKey: ["job", params.slug],
      queryFn: () => fetchJob(params.slug),
    });
  },
  head: ({ params, loaderData }) => {
    const j = (loaderData as any)?.job;
    return {
      meta: [
        { title: j ? `${j.title} at ${j.company} — Career Updates` : "Job — Career Updates" },
        {
          name: "description",
          content: j?.meta_description ?? j?.ai_summary?.slice(0, 160) ?? "Job details on Career Updates.",
        },
        { property: "og:title", content: j ? `${j.title} at ${j.company}` : "Career Updates" },
        { property: "og:description", content: j?.meta_description ?? "" },
        { property: "og:url", content: `/jobs/${params.slug}` },
        { property: "og:type", content: "article" },
        ...(j?.company_logo ? [{ property: "og:image", content: j.company_logo }] : []),
      ],
      links: [{ rel: "canonical", href: `/jobs/${params.slug}` }],
      scripts: j
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "JobPosting",
                title: j.title,
                description: j.description || j.ai_summary,
                datePosted: j.posted_date,
                validThrough: j.last_date,
                employmentType: j.employment_type,
                hiringOrganization: { "@type": "Organization", name: j.company, logo: j.company_logo },
                jobLocation: {
                  "@type": "Place",
                  address: { "@type": "PostalAddress", addressLocality: j.location },
                },
                baseSalary: j.salary,
                applicantLocationRequirements: j.location ? {
                  "@type": "Country",
                  name: j.location
                } : undefined,
                directApply: true,
                url: j.apply_url,
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Job not found</h1>
        <p className="mt-2 text-muted-foreground">
          The job you're looking for may have been closed or moved.
        </p>
        <Link to="/search" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground">
          Browse all jobs
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
      <SiteFooter />
    </div>
  ),
  component: JobDetails,
});

function JobDetails() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery({ queryKey: ["job", slug], queryFn: () => fetchJob(slug) });
  const job = data.job;

  const facts = [
    { icon: Building2, label: "Company", value: job.company },
    { icon: Wallet, label: "Salary", value: job.salary },
    { icon: MapPin, label: "Location", value: job.location },
    { icon: Briefcase, label: "Experience", value: job.experience },
    { icon: GraduationCap, label: "Qualification", value: job.qualification },
    {
      icon: Calendar,
      label: "Last Date",
      value: job.last_date
        ? new Date(job.last_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : null,
    },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="glass rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
              <CompanyLogo url={job.company_logo} name={job.company} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-brand">{job.category ?? "Job"}</p>
              <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                {job.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-3">
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{f.label}</dt>
                  <dd className="truncate text-sm font-medium text-foreground">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </header>

        <AdSlot />

        {/* AI Summary */}
        {job.ai_summary && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              Overview <span className="ml-2 align-middle rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand">AI Summary</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.ai_summary}</p>
          </section>
        )}

        {/* Description */}
        {job.description && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Job Description</h2>
            <div
              className="prose prose-sm sm:prose-base dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:tracking-tight
                prose-h1:text-xl prose-h2:text-xl prose-h3:text-lg
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                prose-li:marker:text-brand
                prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: marked(job.description) as string }}
            />
          </section>
        )}

        {/* Key Skills */}
        {job.tags && job.tags.length > 0 && (
          <section className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Key Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.tags.map((tag: string) => (
                <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        <AdSlot />

        {/* Apply CTA */}
        <section className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold">Ready to apply?</h2>
          <p className="text-sm text-muted-foreground">
            You'll be redirected to the official career page of {job.company}.
          </p>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition-transform hover:scale-105"
          >
            Apply on Official Site <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        {/* Related */}
        {data.related.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Related Jobs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.related.map((r) => (
                <JobCard key={r.id} job={r} compact />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
