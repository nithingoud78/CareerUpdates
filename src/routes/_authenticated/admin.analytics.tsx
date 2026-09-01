import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Eye,
  Briefcase,
  MousePointerClick,
  BookOpen,
  Search,
  Activity,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import {
  getAnalyticsSummary,
  getAnalyticsTrend,
  getTopJobs,
  getTopBlogs,
  getTopSearches,
  getDeviceBreakdown,
  getRecentActivity,
} from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AnalyticsDashboard,
});

// --- Date range presets -------------------------------------------------------

type Preset = "today" | "yesterday" | "7d" | "30d";

function getRange(preset: Preset): { from: string; to: string; label: string } {
  const now = new Date();
  // Use IST (UTC+5:30) for boundary calculation
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + IST_OFFSET);
  const todayStr = todayIST.toISOString().slice(0, 10);

  if (preset === "today") {
    return {
      from: `${todayStr}T00:00:00.000Z`,
      to: now.toISOString(),
      label: "Today",
    };
  }
  if (preset === "yesterday") {
    const yday = new Date(todayIST.getTime() - 24 * 60 * 60 * 1000);
    const ydayStr = yday.toISOString().slice(0, 10);
    return {
      from: `${ydayStr}T00:00:00.000Z`,
      to: `${todayStr}T00:00:00.000Z`,
      label: "Yesterday",
    };
  }
  if (preset === "7d") {
    const d = new Date(todayIST.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      from: `${d.toISOString().slice(0, 10)}T00:00:00.000Z`,
      to: now.toISOString(),
      label: "Last 7 Days",
    };
  }
  // 30d default
  const d = new Date(todayIST.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: `${d.toISOString().slice(0, 10)}T00:00:00.000Z`,
    to: now.toISOString(),
    label: "Last 30 Days",
  };
}

// --- Helpers ------------------------------------------------------------------

function fmt(n: number | null | undefined): string {
  if (n == null) return "�";
  return n.toLocaleString("en-IN");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "�";
  return `${n.toFixed(2)}%`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const EVENT_LABELS: Record<string, string> = {
  job_view: "Job View",
  apply_click: "Apply Click",
  blog_view: "Blog View",
  search: "Search",
  page_view: "Page View",
};

// --- Chart line options -------------------------------------------------------

const CHART_LINES: { key: string; label: string; color: string }[] = [
  { key: "visitors", label: "Visitors", color: "#8b5cf6" },
  { key: "page_views", label: "Page Views", color: "#06b6d4" },
  { key: "sessions", label: "Sessions", color: "#10b981" },
  { key: "job_views", label: "Job Views", color: "#f59e0b" },
  { key: "apply_clicks", label: "Apply Clicks", color: "#ef4444" },
];

// --- Components ---------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-brand",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold flex items-center gap-2">{children}</h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// --- Main Dashboard -----------------------------------------------------------

function AnalyticsDashboard() {
  const [preset, setPreset] = useState<Preset>("7d");
  const [activeLines, setActiveLines] = useState<Set<string>>(
    new Set(["visitors", "page_views", "job_views", "apply_clicks"])
  );

  const range = useMemo(() => getRange(preset), [preset]);

  const getSummary = useServerFn(getAnalyticsSummary);
  const getTrend = useServerFn(getAnalyticsTrend);
  const getJobs = useServerFn(getTopJobs);
  const getBlogs = useServerFn(getTopBlogs);
  const getSearches = useServerFn(getTopSearches);
  const getDevices = useServerFn(getDeviceBreakdown);
  const getRecent = useServerFn(getRecentActivity);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary", range.from, range.to],
    queryFn: () => getSummary({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: trend } = useQuery({
    queryKey: ["analytics-trend", range.from, range.to],
    queryFn: () => getTrend({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: topJobs } = useQuery({
    queryKey: ["analytics-top-jobs", range.from, range.to],
    queryFn: () => getJobs({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: topBlogs } = useQuery({
    queryKey: ["analytics-top-blogs", range.from, range.to],
    queryFn: () => getBlogs({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: searchData } = useQuery({
    queryKey: ["analytics-searches", range.from, range.to],
    queryFn: () => getSearches({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: devices } = useQuery({
    queryKey: ["analytics-devices", range.from, range.to],
    queryFn: () => getDevices({ data: { from: range.from, to: range.to } }),
    staleTime: 30_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["analytics-recent"],
    queryFn: () => getRecent(),
    refetchInterval: 30_000,
  });

  const toggleLine = (key: string) => {
    const next = new Set(activeLines);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    setActiveLines(next);
  };

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
  ];

  const hasSummary = summary && !summaryLoading;

  // Device percentages
  const devTotal = devices?.total ?? 0;
  const devMobile = devTotal > 0 ? Math.round(((devices?.mobile ?? 0) / devTotal) * 100) : 0;
  const devDesktop = devTotal > 0 ? Math.round(((devices?.desktop ?? 0) / devTotal) * 100) : 0;
  const devTablet = devTotal > 0 ? Math.round(((devices?.tablet ?? 0) / devTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand" /> Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Anonymous visitor and engagement metrics. Visitors are estimated � not guaranteed counts of distinct humans.
          </p>
        </div>
        {/* Date Range */}
        <div className="flex gap-1.5 rounded-xl border border-border bg-surface p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                preset === p.key
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          icon={Users}
          label="Visitors"
          value={summaryLoading ? "�" : fmt(summary?.visitors)}
          sub="Est. unique visitors"
          color="text-violet-500"
        />
        <StatCard
          icon={Eye}
          label="Page Views"
          value={summaryLoading ? "�" : fmt(summary?.page_views)}
          color="text-cyan-500"
        />
        <StatCard
          icon={Activity}
          label="Sessions"
          value={summaryLoading ? "�" : fmt(summary?.sessions)}
          sub="Tab sessions"
          color="text-emerald-500"
        />
        <StatCard
          icon={Briefcase}
          label="Job Views"
          value={summaryLoading ? "�" : fmt(summary?.job_views)}
          color="text-amber-500"
        />
        <StatCard
          icon={MousePointerClick}
          label="Apply Clicks"
          value={summaryLoading ? "�" : fmt(summary?.apply_clicks)}
          sub="Not applications"
          color="text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Apply CTR"
          value={
            summaryLoading
              ? "�"
              : summary?.apply_ctr == null
              ? "�"
              : fmtPct(summary.apply_ctr)
          }
          sub="Clicks � Job Views"
          color="text-orange-500"
        />
        <StatCard
          icon={BookOpen}
          label="Blog Views"
          value={summaryLoading ? "�" : fmt(summary?.blog_views)}
          color="text-indigo-500"
        />
      </div>

      {/* Search count */}
      {hasSummary && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <Search className="h-4 w-4 text-brand shrink-0" />
          <span className="text-sm">
            <span className="font-semibold">{fmt(summary?.searches)}</span>{" "}
            <span className="text-muted-foreground">searches in {range.label.toLowerCase()}</span>
          </span>
        </div>
      )}

      {/* Traffic Trend Chart */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle><TrendingUp className="h-5 w-5 text-brand" /> Traffic Trend</SectionTitle>
          {/* Line toggles */}
          <div className="flex flex-wrap gap-2">
            {CHART_LINES.map((l) => (
              <button
                key={l.key}
                onClick={() => toggleLine(l.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                  activeLines.has(l.key)
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground bg-transparent"
                }`}
                style={activeLines.has(l.key) ? { backgroundColor: l.color, borderColor: l.color } : {}}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        {(!trend || trend.length === 0) ? (
          <EmptyState message="No trend data yet for this period. Analytics will appear here as visitors arrive." />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ fontWeight: 600 }}
              />
              {CHART_LINES.filter((l) => activeLines.has(l.key)).map((l) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.label}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two-column: Top Jobs + Devices */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Jobs */}
        <div className="glass rounded-2xl p-6 space-y-4 lg:col-span-2">
          <SectionTitle><Briefcase className="h-5 w-5 text-brand" /> Top Jobs</SectionTitle>
          {(!topJobs || topJobs.length === 0) ? (
            <EmptyState message="No job view data yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Job</th>
                    <th className="pb-2 text-right">Views</th>
                    <th className="pb-2 text-right">Apply Clicks</th>
                    <th className="pb-2 text-right">Apply CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topJobs.slice(0, 10).map((j, i) => (
                    <tr key={j.job_id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
                      <td className="py-2 pr-4">
                        <Link to="/jobs/$slug" params={{ slug: j.slug }} className="hover:text-brand font-medium line-clamp-1">
                          {j.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{j.company}</p>
                      </td>
                      <td className="py-2 text-right tabular-nums">{fmt(j.views)}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(j.apply_clicks)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {j.views >= 5 ? (
                          <span className={`font-medium ${(j.apply_ctr ?? 0) >= 20 ? "text-brand" : ""}`}>
                            {fmtPct(j.apply_ctr)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Low data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <SectionTitle><Smartphone className="h-5 w-5 text-brand" /> Devices</SectionTitle>
          {devTotal === 0 ? (
            <EmptyState message="No device data yet." />
          ) : (
            <div className="space-y-4">
              <DeviceBar icon={Monitor} label="Desktop" pct={devDesktop} color="bg-brand" />
              <DeviceBar icon={Smartphone} label="Mobile" pct={devMobile} color="bg-cyan-500" />
              <DeviceBar icon={Tablet} label="Tablet" pct={devTablet} color="bg-amber-500" />
              <p className="text-xs text-muted-foreground pt-2">
                Based on {fmt(devTotal)} unique visitor sessions. Coarse classification by screen width.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Blog Posts */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <SectionTitle><BookOpen className="h-5 w-5 text-brand" /> Top Blog Posts</SectionTitle>
        {(!topBlogs || topBlogs.length === 0) ? (
          <EmptyState message="No blog view data yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Article</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Est. Unique Visitors</th>
                </tr>
              </thead>
              <tbody>
                {topBlogs.slice(0, 10).map((b, i) => (
                  <tr key={b.blog_id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground text-xs tabular-nums">{i + 1}</td>
                    <td className="py-2 pr-4">
                      <Link to="/blog/$slug" params={{ slug: b.slug }} className="hover:text-brand font-medium line-clamp-1">
                        {b.title}
                      </Link>
                    </td>
                    <td className="py-2 text-right tabular-nums">{fmt(b.views)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(b.unique_visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-column: Searches + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Searches */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle><Search className="h-5 w-5 text-brand" /> Top Searches</SectionTitle>
            {(searchData?.total ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">{fmt(searchData?.total)} total</span>
            )}
          </div>
          {(!searchData?.top || searchData.top.length === 0) ? (
            <EmptyState message="No search data yet." />
          ) : (
            <div className="space-y-2">
              {searchData.top.slice(0, 15).map((s, i) => (
                <div key={s.query} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 w-5 text-xs text-muted-foreground tabular-nums text-right">{i + 1}</span>
                    <span className="truncate text-sm">{s.query}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <SectionTitle><Activity className="h-5 w-5 text-brand" /> Recent Activity</SectionTitle>
          {(!recent || recent.length === 0) ? (
            <EmptyState message="No recent activity yet." />
          ) : (
            <div className="space-y-2">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground w-12">
                    {formatTime(e.created_at)}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    e.event_type === "apply_click"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : e.event_type === "job_view"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : e.event_type === "blog_view"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {EVENT_LABELS[e.event_type] ?? e.event_type}
                  </span>
                  <span className="truncate text-muted-foreground">{e.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy note */}
      <div className="rounded-xl border border-border/50 bg-surface/50 p-4 text-xs text-muted-foreground">
        <strong>Privacy:</strong> Analytics use anonymous visitor IDs (localStorage) and session IDs (sessionStorage). No names, emails, IP addresses, or personally identifiable information are stored. Visitor counts are estimates � not guaranteed counts of distinct human beings. Device classification is coarse (by screen width). Bot filtering is best-effort only.
      </div>
    </div>
  );
}

function DeviceBar({
  icon: Icon,
  label,
  pct,
  color,
}: {
  icon: React.ElementType;
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{label}</span>
        </div>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}