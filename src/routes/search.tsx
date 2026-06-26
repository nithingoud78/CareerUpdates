
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { AdSlot } from "@/components/ad-slot";
import { StickySocial } from "@/components/sticky-social";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search Jobs — Career Updates" },
      {
        name: "description",
        content:
          "Search latest jobs, internships and career opportunities. Filter by category and employment type.",
      },
      { property: "og:title", content: "Search Jobs — Career Updates" },
      { property: "og:url", content: "/search" },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

const TAXONOMY: Record<string, string[]> = {
  IT: ["Software Engineering", "Cloud Engineering", "DevOps", "Data Engineering", "Data Science", "Cybersecurity", "QA", "Technical Support"],
  Government: ["PSU", "Research", "Defence", "Banking"],
  Internship: ["Software", "Data", "General"],
  Business: ["Analyst", "Operations", "Consulting"],
};
const CATEGORIES = Object.keys(TAXONOMY);
const TYPES = ["Full-time", "Internship", "Government", "Contract"];

type Job = {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_logo: string | null;
  company_logo_storage_url: string | null;
  location: string | null;
  experience: string | null;
  salary: string | null;
  last_date: string | null;
  category: string | null;
  employment_type: string | null;
};

// Fetch ALL published jobs once — counts and filtering are done client-side.
async function fetchAllPublishedJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, company, company_logo, company_logo_storage_url, location, experience, salary, last_date, category, employment_type",
    )
    .eq("status", "published")
    .order("posted_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [q, setQ] = useState(search.q ?? "");

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  // Single query fetches all published jobs; stale time is generous so it doesn't
  // re-fetch on every filter click — counts always reflect the live published set.
  const { data: allJobs = [], isFetching } = useQuery({
    queryKey: ["search-all-jobs"],
    queryFn: fetchAllPublishedJobs,
    staleTime: 60_000, // 1 minute
  });

  // Derive per-category and per-type counts from the full dataset.
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const job of allJobs) {
      if (job.category) map[job.category] = (map[job.category] ?? 0) + 1;
    }
    return map;
  }, [allJobs]);

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const job of allJobs) {
      if (job.employment_type) map[job.employment_type] = (map[job.employment_type] ?? 0) + 1;
    }
    return map;
  }, [allJobs]);

  // Apply all active filters client-side — instant, no extra DB calls.
  const filteredJobs = useMemo(() => {
    let result = allJobs;

    if (search.q) {
      const lq = search.q.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(lq) ||
          j.company.toLowerCase().includes(lq) ||
          (j.location ?? "").toLowerCase().includes(lq),
      );
    }
    if (search.category) {
      result = result.filter((j) => j.category === search.category);
    }
    if (search.type) {
      result = result.filter((j) => j.employment_type === search.type);
    }
    return result;
  }, [allJobs, search.q, search.category, search.type]);

  function update(partial: Record<string, string | undefined>) {
    navigate({
      search: (prev: Record<string, string | undefined>) => ({ ...prev, ...partial }),
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: q || undefined });
  }

  const hasFilters = !!(search.q || search.category || search.type);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="flex items-center gap-1 sm:gap-2 rounded-full border border-border bg-background p-1 sm:p-1.5">
            <SearchIcon className="ml-2 sm:ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              aria-label="Search jobs, companies, keywords"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs, companies, keywords..."
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs sm:text-sm outline-none"
            />
            <button className="shrink-0 rounded-full bg-brand px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-brand-foreground">
              Search
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            {isFetching && !allJobs.length
              ? "Searching…"
              : `${filteredJobs.length} Result${filteredJobs.length !== 1 ? "s" : ""}`}
            {search.q && ` for "${search.q}"`}
          </p>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-3 py-8 sm:px-6 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] lg:px-8">
        {/* Mobile Filters */}
        <div className="md:hidden">
          <details className="group rounded-2xl border border-border bg-surface [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold outline-none marker:content-none">
              Filters {hasFilters && <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">{[search.category, search.type].filter(Boolean).length}</span>}
              <span className="transition-transform group-open:-rotate-180">
                <ChevronDown className="h-5 w-5" />
              </span>
            </summary>
            <div className="border-t border-border p-4 pt-4">
              <FiltersContent
                search={search}
                update={update}
                reset={() => navigate({ search: {} })}
                totalCount={allJobs.length}
                categoryCounts={categoryCounts}
                typeCounts={typeCounts}
              />
            </div>
          </details>
        </div>

        {/* Desktop Filters */}
        <aside className="glass hidden space-y-5 self-start rounded-2xl p-5 md:block">
          <FiltersContent
            search={search}
            update={update}
            reset={() => navigate({ search: {} })}
            totalCount={allJobs.length}
            categoryCounts={categoryCounts}
            typeCounts={typeCounts}
          />
        </aside>

        {/* Results */}
        <div className="space-y-5">
          <AdSlot label="Advertisement · 728×90" />
          {isFetching && !allJobs.length && (
            <p className="text-sm text-muted-foreground">Loading jobs…</p>
          )}
          {!isFetching && filteredJobs.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-base font-semibold">No jobs match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword or reset the filters.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredJobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}

interface FiltersContentProps {
  search: { category?: string; subcategory?: string; type?: string };
  update: (partial: Record<string, string | undefined>) => void;
  reset: () => void;
  totalCount: number;
  categoryCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

function FiltersContent({ search, update, reset, totalCount, categoryCounts, typeCounts }: FiltersContentProps) {
  const subcategories = search.category ? TAXONOMY[search.category] || [] : [];
  const hasFilters = !!(search.category || search.type);

  return (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </h3>
        <div className="space-y-1">
          {/* All Jobs option */}
          <FilterButton
            label="All Jobs"
            count={totalCount}
            active={!search.category}
            onClick={() => update({ category: undefined, subcategory: undefined })}
          />
          {CATEGORIES.map((cat) => (
            <FilterButton
              key={cat}
              label={cat}
              count={categoryCounts[cat] ?? 0}
              active={search.category === cat}
              onClick={() =>
                update({
                  category: search.category === cat ? undefined : cat,
                  subcategory: undefined,
                })
              }
            />
          ))}
        </div>
      </div>

      {/* Subcategory — shown only when a category is selected */}
      {subcategories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Subcategory
          </h3>
          <div className="space-y-1">
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() =>
                  update({ subcategory: search.subcategory === sub ? undefined : sub })
                }
                className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  (search as any).subcategory === sub
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Employment Type */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Employment Type
        </h3>
        <div className="space-y-1">
          {/* All option */}
          <FilterButton
            label="All"
            count={totalCount}
            active={!search.type}
            onClick={() => update({ type: undefined })}
          />
          {TYPES.map((t) => (
            <FilterButton
              key={t}
              label={t}
              count={typeCounts[t] ?? 0}
              active={search.type === t}
              onClick={() => update({ type: search.type === t ? undefined : t })}
            />
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={reset}
          className="w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        active
          ? "bg-brand/10 font-semibold text-brand"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      <span
        className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
          active
            ? "bg-brand text-brand-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
