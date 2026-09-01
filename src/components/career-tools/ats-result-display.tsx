import { CheckCircle2, AlertCircle, XCircle, TrendingUp, TrendingDown, Info } from "lucide-react";
import type { AtsResult } from "@/lib/ats-checker.functions";

interface AtsResultDisplayProps {
  result: AtsResult;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-green-600 dark:text-green-400"
    : score >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  const label =
    score >= 75 ? "Good Match" : score >= 50 ? "Fair Match" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 ${
        score >= 75 ? "border-green-500" : score >= 50 ? "border-amber-500" : "border-red-500"
      } bg-surface`}>
        <div className="text-center">
          <span className={`text-4xl font-bold ${color}`}>{score}</span>
          <span className="block text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <p className={`text-sm font-semibold ${color}`}>{label}</p>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        ATS compatibility estimate — not a guarantee of ATS pass rate
      </p>
    </div>
  );
}

function BreakdownBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground">
          {score}/100 <span className="text-[10px]">({weight})</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${score} out of 100`}
        />
      </div>
    </div>
  );
}

function KeywordPill({ word, found }: { word: string; found: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        found
          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
      }`}
    >
      {found ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {word}
    </span>
  );
}

function Section({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5 space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-foreground">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AtsResultDisplay({ result }: AtsResultDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Score + summary */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
          <ScoreRing score={result.overall_score} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <h2 className="text-xl font-bold">ATS Compatibility Report</h2>
            {result.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <Section title="Score Breakdown" icon={TrendingUp} iconColor="text-brand">
        <div className="space-y-3">
          <BreakdownBar label="Keyword Match" score={result.breakdown.keyword_match} weight="30%" />
          <BreakdownBar label="Skills Match" score={result.breakdown.skills_match} weight="20%" />
          <BreakdownBar label="Experience Match" score={result.breakdown.experience_match} weight="15%" />
          <BreakdownBar label="Education Match" score={result.breakdown.education_match} weight="10%" />
          <BreakdownBar label="ATS Formatting Signals" score={result.breakdown.formatting} weight="10%" />
          <BreakdownBar label="Section Completeness" score={result.breakdown.completeness} weight="10%" />
          <BreakdownBar label="JD Alignment" score={result.breakdown.jd_alignment} weight="5%" />
        </div>
      </Section>

      {/* Keywords grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {result.matched_keywords.length > 0 && (
          <Section title="Matched Keywords" icon={CheckCircle2} iconColor="text-green-600">
            <div className="flex flex-wrap gap-1.5">
              {result.matched_keywords.map((kw) => (
                <KeywordPill key={kw} word={kw} found />
              ))}
            </div>
          </Section>
        )}
        {result.missing_keywords.length > 0 && (
          <Section title="Missing Keywords" icon={XCircle} iconColor="text-red-500">
            <div className="flex flex-wrap gap-1.5">
              {result.missing_keywords.map((kw) => (
                <KeywordPill key={kw} word={kw} found={false} />
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Important missing skills */}
      {result.important_skills_missing.length > 0 && (
        <Section title="Important Skills Missing" icon={AlertCircle} iconColor="text-amber-500">
          <ul className="space-y-1.5">
            {result.important_skills_missing.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {s}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground italic">
            Only add skills you genuinely have. Never misrepresent your experience.
          </p>
        </Section>
      )}

      {/* Resume strengths */}
      {result.resume_strengths.length > 0 && (
        <Section title="Resume Strengths" icon={CheckCircle2} iconColor="text-green-600">
          <ul className="space-y-1.5">
            {result.resume_strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Formatting issues */}
      {result.formatting_issues.length > 0 && (
        <Section title="Formatting Issues" icon={AlertCircle} iconColor="text-amber-500">
          <ul className="space-y-1.5">
            {result.formatting_issues.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Improvement suggestions */}
      {result.improvement_suggestions.length > 0 && (
        <Section title="Improvement Suggestions" icon={TrendingUp} iconColor="text-brand">
          <ul className="space-y-2">
            {result.improvement_suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          This analysis is an ATS compatibility estimate based on keyword and content comparison. It does not
          guarantee that your resume will pass any specific ATS or result in an interview. Results depend on
          the actual ATS system used by the employer, which may differ from this analysis.
        </p>
      </div>
    </div>
  );
}
