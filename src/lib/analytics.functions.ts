/**
 * analytics.functions.ts
 * =======================
 * Server functions for analytics recording and admin reporting.
 *
 * NOTE: analytics_events is a new table added via migration 20260901000000_analytics.sql.
 * The Supabase generated types have NOT been regenerated yet (requires running supabase gen types).
 * All analytics_events queries use explicit `as any` casts to bypass the stale type definitions.
 * This is correct and safe - the table exists in the database via the migration.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

function analyticsTable(supabase: any) {
  return (supabase as any).from("analytics_events");
}

// ─── Event Schema ─────────────────────────────────────────────────────────────

const EventSchema = z.object({
  event_type: z.enum([
    "page_view",
    "job_view",
    "blog_view",
    "search",
    "apply_click",
    "company_view",
    "category_view",
  ]),
  path: z.string().max(500),
  visitor_id: z.string().max(36),
  session_id: z.string().max(36),
  job_id: z.string().uuid().optional(),
  blog_id: z.string().uuid().optional(),
  search_query: z.string().max(500).optional(),
  referrer: z.string().max(200).optional(),
  device_type: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

type EventInput = z.infer<typeof EventSchema>;

// ─── Public: record one event ─────────────────────────────────────────────────

export const recordAnalyticsEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => EventSchema.parse(data))
  .handler(async ({ data }: { data: EventInput }) => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.SUPABASE_URL!;
      const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
      if (!url || !key) return { ok: false };

      const supabase = createClient(url, key);
      const { error } = await (supabase as any).from("analytics_events").insert({
        event_type: data.event_type,
        path: data.path,
        visitor_id: data.visitor_id,
        session_id: data.session_id,
        job_id: data.job_id ?? null,
        blog_id: data.blog_id ?? null,
        search_query: data.search_query ?? null,
        referrer: data.referrer ?? null,
        device_type: data.device_type ?? null,
      });

      if (error) return { ok: false };
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

// ─── Admin date range schema ──────────────────────────────────────────────────

const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

type DateRange = z.infer<typeof DateRangeSchema>;

// ─── Admin: KPI summary ───────────────────────────────────────────────────────

export interface AnalyticsSummary {
  visitors: number;
  page_views: number;
  sessions: number;
  job_views: number;
  apply_clicks: number;
  blog_views: number;
  searches: number;
  apply_ctr: number | null;
}

export const getAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<AnalyticsSummary> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("event_type, visitor_id, session_id")
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) throw new Error(error.message);

    const events: { event_type: string; visitor_id: string; session_id: string }[] = rows ?? [];

    const visitors = new Set(events.map((e) => e.visitor_id)).size;
    const sessions = new Set(events.map((e) => e.session_id)).size;
    const page_views = events.filter((e) => e.event_type === "page_view").length;
    const job_views = events.filter((e) => e.event_type === "job_view").length;
    const apply_clicks = events.filter((e) => e.event_type === "apply_click").length;
    const blog_views = events.filter((e) => e.event_type === "blog_view").length;
    const searches = events.filter((e) => e.event_type === "search").length;
    const apply_ctr = job_views > 0 ? (apply_clicks / job_views) * 100 : null;

    return { visitors, page_views, sessions, job_views, apply_clicks, blog_views, searches, apply_ctr };
  });

// ─── Admin: daily trend ───────────────────────────────────────────────────────

export interface DailyTrend {
  date: string;
  visitors: number;
  page_views: number;
  sessions: number;
  job_views: number;
  apply_clicks: number;
}

export const getAnalyticsTrend = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<DailyTrend[]> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("event_type, visitor_id, session_id, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    type EventRow = { event_type: string; visitor_id: string; session_id: string; created_at: string };

    const byDate: Record<string, { visitors: Set<string>; sessions: Set<string>; page_views: number; job_views: number; apply_clicks: number }> = {};

    for (const row of (rows ?? []) as EventRow[]) {
      const d = new Date(row.created_at);
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const dateKey = ist.toISOString().slice(0, 10);

      if (!byDate[dateKey]) {
        byDate[dateKey] = { visitors: new Set(), sessions: new Set(), page_views: 0, job_views: 0, apply_clicks: 0 };
      }
      byDate[dateKey].visitors.add(row.visitor_id);
      byDate[dateKey].sessions.add(row.session_id);
      if (row.event_type === "page_view") byDate[dateKey].page_views++;
      if (row.event_type === "job_view") byDate[dateKey].job_views++;
      if (row.event_type === "apply_click") byDate[dateKey].apply_clicks++;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        visitors: v.visitors.size,
        page_views: v.page_views,
        sessions: v.sessions.size,
        job_views: v.job_views,
        apply_clicks: v.apply_clicks,
      }));
  });

// ─── Admin: top jobs ─────────────────────────────────────────────────────────

export interface TopJob {
  job_id: string;
  title: string;
  company: string;
  slug: string;
  views: number;
  apply_clicks: number;
  apply_ctr: number | null;
}

export const getTopJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<TopJob[]> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("event_type, job_id")
      .in("event_type", ["job_view", "apply_click"])
      .not("job_id", "is", null)
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) throw new Error(error.message);

    type EvRow = { event_type: string; job_id: string };
    const map: Record<string, { views: number; apply_clicks: number }> = {};
    for (const row of (rows ?? []) as EvRow[]) {
      if (!row.job_id) continue;
      if (!map[row.job_id]) map[row.job_id] = { views: 0, apply_clicks: 0 };
      if (row.event_type === "job_view") map[row.job_id].views++;
      if (row.event_type === "apply_click") map[row.job_id].apply_clicks++;
    }

    const jobIds = Object.keys(map);
    if (jobIds.length === 0) return [];

    const { data: jobs } = await context.supabase
      .from("jobs")
      .select("id, title, company, slug")
      .in("id", jobIds);

    return ((jobs ?? []) as { id: string; title: string; company: string; slug: string }[])
      .map((j) => {
        const stats = map[j.id] ?? { views: 0, apply_clicks: 0 };
        return {
          job_id: j.id,
          title: j.title,
          company: j.company,
          slug: j.slug,
          views: stats.views,
          apply_clicks: stats.apply_clicks,
          apply_ctr: stats.views > 0 ? (stats.apply_clicks / stats.views) * 100 : null,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  });

// ─── Admin: top blogs ─────────────────────────────────────────────────────────

export interface TopBlog {
  blog_id: string;
  title: string;
  slug: string;
  views: number;
  unique_visitors: number;
}

export const getTopBlogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<TopBlog[]> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("blog_id, visitor_id")
      .eq("event_type", "blog_view")
      .not("blog_id", "is", null)
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) throw new Error(error.message);

    type BlogRow = { blog_id: string; visitor_id: string };
    const map: Record<string, { views: number; visitors: Set<string> }> = {};
    for (const row of (rows ?? []) as BlogRow[]) {
      if (!row.blog_id) continue;
      if (!map[row.blog_id]) map[row.blog_id] = { views: 0, visitors: new Set() };
      map[row.blog_id].views++;
      map[row.blog_id].visitors.add(row.visitor_id);
    }

    const blogIds = Object.keys(map);
    if (blogIds.length === 0) return [];

    const { data: blogs } = await context.supabase
      .from("blogs")
      .select("id, title, slug")
      .in("id", blogIds);

    return ((blogs ?? []) as { id: string; title: string; slug: string }[])
      .map((b) => {
        const stats = map[b.id] ?? { views: 0, visitors: new Set<string>() };
        return {
          blog_id: b.id,
          title: b.title,
          slug: b.slug,
          views: stats.views,
          unique_visitors: stats.visitors.size,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  });

// ─── Admin: top searches ──────────────────────────────────────────────────────

export interface TopSearch {
  query: string;
  count: number;
}

export const getTopSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ total: number; top: TopSearch[] }> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("search_query")
      .eq("event_type", "search")
      .not("search_query", "is", null)
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) throw new Error(error.message);

    type SqRow = { search_query: string | null };
    const map: Record<string, number> = {};
    for (const row of (rows ?? []) as SqRow[]) {
      if (!row.search_query) continue;
      const q = row.search_query.toLowerCase().trim();
      if (!q) continue;
      map[q] = (map[q] ?? 0) + 1;
    }

    const top: TopSearch[] = Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .map(([query, count]) => ({ query, count }));

    return { total: (rows ?? []).length, top };
  });

// ─── Admin: device breakdown ──────────────────────────────────────────────────

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
  total: number;
}

export const getDeviceBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: DateRange) => DateRangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<DeviceBreakdown> => {
    await assertAdmin(context);
    const { from, to } = data;

    const { data: rows, error } = await analyticsTable(context.supabase)
      .select("device_type, visitor_id")
      .eq("event_type", "page_view")
      .gte("created_at", from)
      .lte("created_at", to);

    if (error) throw new Error(error.message);

    type DRow = { device_type: string | null; visitor_id: string };
    const deviceVisitors: Record<string, Set<string>> = {
      mobile: new Set(),
      desktop: new Set(),
      tablet: new Set(),
    };

    for (const row of (rows ?? []) as DRow[]) {
      const d = row.device_type ?? "desktop";
      if (deviceVisitors[d]) deviceVisitors[d].add(row.visitor_id);
    }

    const mobile = deviceVisitors.mobile.size;
    const desktop = deviceVisitors.desktop.size;
    const tablet = deviceVisitors.tablet.size;
    return { mobile, desktop, tablet, total: mobile + desktop + tablet };
  });

// ─── Admin: recent activity ───────────────────────────────────────────────────

export interface RecentEvent {
  id: string;
  event_type: string;
  path: string;
  job_id: string | null;
  blog_id: string | null;
  created_at: string;
}

export const getRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RecentEvent[]> => {
    await assertAdmin(context);

    const { data, error } = await analyticsTable(context.supabase)
      .select("id, event_type, path, job_id, blog_id, created_at")
      .in("event_type", ["job_view", "apply_click", "blog_view", "search"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return (data ?? []) as RecentEvent[];
  });