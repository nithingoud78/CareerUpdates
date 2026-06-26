import { Link } from "@tanstack/react-router";
import { Briefcase, Calendar, MapPin, Wallet } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { CompanyLogo } from "./company-logo";

type Job = Pick<
  Tables<"jobs">,
  "id" | "slug" | "title" | "company" | "company_logo" | "company_logo_storage_url" | "location" | "experience" | "salary" | "last_date" | "category"
>;

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  return (
    <Link
      to="/jobs/$slug"
      params={{ slug: job.slug }}
      className="group glass relative flex min-w-0 flex-col gap-3 sm:gap-4 rounded-2xl p-3 sm:p-5 transition-all hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted">
          <CompanyLogo
            storageUrl={job.company_logo_storage_url}
            url={job.company_logo}
            name={job.company}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-brand">
            {job.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{job.company}</p>
        </div>
        {job.category && (
          <span className="hidden shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand sm:inline">
            {job.category}
          </span>
        )}
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
          )}
          {job.experience && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {job.experience}
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" /> {job.salary}
            </span>
          )}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-2">
        {job.last_date ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Last date: {new Date(job.last_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        ) : <span />}
        <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold text-brand-foreground transition-transform group-hover:scale-105">
          Apply Now
        </span>
      </div>
    </Link>
  );
}
