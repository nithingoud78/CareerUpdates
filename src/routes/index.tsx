import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { AdSlot } from "@/components/ad-slot";
import { StickySocial } from "@/components/sticky-social";

const TRENDING = ["Infosys", "TCS", "Wipro", "Google", "Accenture", "Amazon"];

async function fetchHomeJobs() {
  try {
    console.error("[DEBUG] Starting fetchHomeJobs");
    const [latest, govt, intern] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category")
        .eq("status", "published")
        .order("posted_date", { ascending: false })
        .limit(6),
      supabase
        .from("jobs")
        .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category")
        .eq("status", "published")
        .eq("category", "Government")
        .order("posted_date", { ascending: false })
        .limit(4),
      supabase
        .from("jobs")
        .select("id, slug, title, company, company_logo, location, experience, salary, last_date, category")
        .eq("status", "published")
        .eq("category", "Internship")
        .order("posted_date", { ascending: false })
        .limit(4),
    ]);
    console.error("[DEBUG] fetchHomeJobs complete", { latestLen: latest.data?.length });
    return {
      latest: latest.data ?? [],
      govt: govt.data ?? [],
      intern: intern.data ?? [],
    };
  } catch (err: any) {
    console.error("[DEBUG] SSR CRASH in fetchHomeJobs:", err.message);
    console.error("[DEBUG] Stack:", err.stack);
    throw err;
  }
}

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      console.error("[DEBUG] Executing index loader");
      await context.queryClient.ensureQueryData({
        queryKey: ["home-jobs"],
        queryFn: fetchHomeJobs,
      });
      console.error("[DEBUG] index loader complete");
    } catch (err: any) {
      console.error("[DEBUG] SSR CRASH in index loader:", err.message);
      console.error("[DEBUG] Stack:", err.stack);
      throw err;
    }
  },
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery({ queryKey: ["home-jobs"], queryFn: fetchHomeJobs });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/search", search: { q: q || undefined } });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_70%)]" />
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-24 text-center sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
          <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Curated official openings · Updated daily
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Find Your Next <span className="text-brand">Career Opportunity</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Latest jobs, internships and career opportunities — sourced from official company
            career pages.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Search the keyword or job you are looking for here.
          </p>

          <form onSubmit={onSearch} className="mx-auto mt-6 w-full max-w-2xl px-2 sm:px-0">
            <div className="glass-strong flex items-center gap-1 sm:gap-2 rounded-full p-1.5 shadow-lg shadow-brand/5">
              <Search className="ml-2 sm:ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                aria-label="Search by job title, company, or keyword"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by job title, company, or keyword..."
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-brand px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">Trending:</span>
            {TRENDING.map((t) => (
              <Link
                key={t}
                to="/search"
                search={{ q: t }}
                className="rounded-full border border-border bg-surface px-3 py-1 font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        <AdSlot />

        {/* LATEST */}
        <section>
          <SectionHeading title="Latest Opportunities" link="/search" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.latest.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        <AdSlot />

        {/* GOV + INTERN */}
        <div className="grid gap-8 lg:grid-cols-2">
          {data.intern.length > 0 && (
            <section>
              <SectionHeading title="Internships" link="/search" search={{ category: "Internship" }} />
              <div className="grid gap-4 sm:grid-cols-2">
                {data.intern.map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            </section>
          )}
          {data.govt.length > 0 && (
            <section>
              <SectionHeading title="Government Jobs" link="/search" search={{ category: "Government" }} />
              <div className="grid gap-4 sm:grid-cols-2">
                {data.govt.map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}

function SectionHeading({
  title,
  link,
  search,
}: {
  title: string;
  link: string;
  search?: Record<string, string>;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        <span className="text-brand">{title}</span>
      </h2>
      <Link
        to={link as any}
        search={search as any}
        className="text-sm font-medium text-brand hover:underline"
      >
        View all →
      </Link>
    </div>
  );
}
