import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText, Package, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { ScrollReveal } from "@/components/scroll-reveal";

import { StickySocial } from "@/components/sticky-social";

const TRENDING = ["Infosys", "TCS", "Wipro", "Google", "Accenture", "Amazon"];

async function fetchHomeJobs() {
  try {
    console.error("[DEBUG] Starting fetchHomeJobs");
    const [latest, govt, intern, bundlePrice, templatePrice, atsSettings] = await Promise.all([
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
      supabase
        .from("career_tool_products")
        .select("current_price, is_free")
        .eq("status", "published")
        .eq("product_type", "bundle")
        .not("current_price", "is", null)
        .order("is_free", { ascending: false, nullsFirst: false })
        .order("current_price", { ascending: true })
        .limit(1),
      supabase
        .from("career_tool_products")
        .select("current_price, is_free")
        .eq("status", "published")
        .eq("product_type", "single_template")
        .not("current_price", "is", null)
        .order("is_free", { ascending: false, nullsFirst: false })
        .order("current_price", { ascending: true })
        .limit(1),
      supabase
        .from("ats_settings")
        .select("current_price")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
    ]);
    console.error("[DEBUG] fetchHomeJobs complete", { latestLen: latest.data?.length });
    return {
      latest: latest.data ?? [],
      govt: govt.data ?? [],
      intern: intern.data ?? [],
      minBundlePrice: bundlePrice.data?.[0] ? (bundlePrice.data[0].is_free ? 0 : bundlePrice.data[0].current_price) : null,
      minTemplatePrice: templatePrice.data?.[0] ? (templatePrice.data[0].is_free ? 0 : templatePrice.data[0].current_price) : null,
      atsPrice: atsSettings.data?.current_price ?? null,
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
        <ScrollReveal className="mx-auto max-w-5xl px-4 pb-12 pt-2 text-center sm:px-6 lg:px-8 lg:pt-4">
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
        </ScrollReveal>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        <AdSlot placement="homeTop" className="mt-8" />

        {/* RESUME TOOLS */}
        <section>
          <ScrollReveal>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                <span className="text-brand">Resume</span> Tools
              </h2>
              <Link to="/ats-resumes-pack" className="text-sm font-medium text-brand hover:underline">
                View all →
              </Link>
            </div>
            <div className="flex snap-x snap-mandatory overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 gap-4 scrollbar-hide">
              <Link
                to="/ats-resumes-pack"
                className="glass flex min-w-[260px] snap-center items-start gap-3 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:shadow-brand/10 hover:-translate-y-0.5 sm:min-w-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                  <Package className="h-5 w-5 text-brand" />
                </span>
                <div>
                  <p className="font-semibold text-foreground leading-tight">ATS Resumes Pack</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    Resume + cover letter + referral message templates in one pack.
                  </p>
                  {data.minBundlePrice != null && (
                    <p className="mt-1.5 text-[11px] font-semibold text-brand">From ₹{data.minBundlePrice} →</p>
                  )}
                </div>
              </Link>
              <Link
                to="/ats-checker"
                className="glass flex min-w-[260px] snap-center items-start gap-3 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:shadow-brand/10 hover:-translate-y-0.5 sm:min-w-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                </span>
                <div>
                  <p className="font-semibold text-foreground leading-tight">ATS Resume Checker</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    Check how well your resume matches a job description.
                  </p>
                  {data.atsPrice != null && data.atsPrice > 0 ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-brand">
                      From ₹{data.atsPrice} →
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-semibold text-brand">Try for free →</p>
                  )}
                </div>
              </Link>
              <Link
                to="/ats-friendly-resumes"
                className="glass flex min-w-[260px] snap-center items-start gap-3 rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:shadow-brand/10 hover:-translate-y-0.5 sm:min-w-0"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                  <FileText className="h-5 w-5 text-brand" />
                </span>
                <div>
                  <p className="font-semibold text-foreground leading-tight">ATS Friendly Resumes (Individual)</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                    ATS-friendly templates for freshers and experienced professionals.
                  </p>
                  {data.minTemplatePrice != null && (
                    <p className="mt-1.5 text-[11px] font-semibold text-brand">From ₹{data.minTemplatePrice} →</p>
                  )}
                </div>
              </Link>
            </div>
          </ScrollReveal>
        </section>
        
        {/* LATEST */}
        <section>
          <ScrollReveal>
            <SectionHeading title="Latest Opportunities" link="/search" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.latest.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </ScrollReveal>
        </section>



        {/* INTERNSHIPS */}
        {data.intern.length > 0 && (
          <section>
            <ScrollReveal>
              <SectionHeading title="Internships" link="/search" search={{ category: "Internship" }} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.intern.map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* GOV ONLY */}
        {data.govt.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <ScrollReveal>
                <SectionHeading title="Government Jobs" link="/search" search={{ category: "Government" }} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.govt.map((job) => (
                    <JobCard key={job.id} job={job} compact />
                  ))}
                </div>
              </ScrollReveal>
            </section>
          </div>
        )}
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
