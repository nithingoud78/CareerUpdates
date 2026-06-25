import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
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

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [q, setQ] = useState(search.q ?? "");

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", search.q, search.category, search.subcategory, search.type],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(
          "id, slug, title, company, company_logo, location, experience, salary, last_date, category, subcategory, employment_type",
        )
        .eq("status", "published")
        .order("posted_date", { ascending: false })
        .limit(40);
      if (search.q) {
        query = query.or(
          `title.ilike.%${search.q}%,company.ilike.%${search.q}%,location.ilike.%${search.q}%`,
        );
      }
      if (search.category) query = query.eq("category", search.category);
      if (search.subcategory) query = query.eq("subcategory", search.subcategory);
      if (search.type) query = query.eq("employment_type", search.type);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  function update(partial: Record<string, string | undefined>) {
    navigate({
      search: (prev: Record<string, string | undefined>) => ({ ...prev, ...partial }),
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update({ q: q || undefined });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5">
            <SearchIcon className="ml-3 h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Search jobs, companies, keywords"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs, companies, keywords..."
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
            />
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
              Search
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            {data ? `${data.length} results` : isFetching ? "Searching..." : ""}
            {search.q && ` for "${search.q}"`}
          </p>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] lg:px-8">
        {/* Mobile Filters */}
        <div className="md:hidden">
          <details className="group rounded-2xl border border-border bg-surface [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold outline-none marker:content-none">
              Filters
              <span className="transition-transform group-open:-rotate-180">
                <ChevronDown className="h-5 w-5" />
              </span>
            </summary>
            <div className="border-t border-border p-4 pt-4">
              <FiltersContent search={search} update={update} reset={() => navigate({ search: {} })} />
            </div>
          </details>
        </div>

        {/* Desktop Filters */}
        <aside className="glass hidden space-y-5 self-start rounded-2xl p-5 md:block">
          <FiltersContent search={search} update={update} reset={() => navigate({ search: {} })} />
        </aside>

        {/* Results */}
        <div className="space-y-5">
          <AdSlot label="Advertisement · 728×90" height={90} />
          {isFetching && !data && (
            <p className="text-sm text-muted-foreground">Loading jobs…</p>
          )}
          {data && data.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-base font-semibold">No jobs match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword or reset the filters.
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {data?.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}

function FiltersContent({ search, update, reset }: { search: any, update: any, reset: any }) {
  const subcategories = search.category ? TAXONOMY[search.category] || [] : [];
  return (
    <div className="space-y-5">
      <FilterGroup
        title="Category"
        options={CATEGORIES}
        active={search.category}
        onChange={(v) => update({ category: v, subcategory: undefined })}
      />
      {subcategories.length > 0 && (
        <FilterGroup
          title="Subcategory"
          options={subcategories}
          active={search.subcategory}
          onChange={(v) => update({ subcategory: v })}
        />
      )}
      <FilterGroup
        title="Employment Type"
        options={TYPES}
        active={search.type}
        onChange={(v) => update({ type: v })}
      />
      <button
        onClick={reset}
        className="w-full rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        Reset filters
      </button>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  active,
  onChange,
}: {
  title: string;
  options: string[];
  active?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(active === opt ? undefined : opt)}
            className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
              active === opt
                ? "bg-brand/10 font-medium text-brand"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
