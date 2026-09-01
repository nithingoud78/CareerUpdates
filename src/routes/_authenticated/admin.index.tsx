import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Archive, Activity, Inbox, Edit, Megaphone } from "lucide-react";
import { listAllJobs, deleteJob, updateJobStatus, bulkUpdateJobStatus, bulkDeleteJobs } from "@/lib/admin-jobs.functions";
import { getUnreadFeedbackCount } from "@/lib/feedback.functions";
import { getAdsConfig, setAdsEnabled } from "@/lib/ads-config.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const list = useServerFn(listAllJobs);
  const del = useServerFn(deleteJob);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: () => list(),
    refetchInterval: 5000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateJobStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const getUnread = useServerFn(getUnreadFeedbackCount);
  const { data: feedbackData } = useQuery({
    queryKey: ["unread-feedback-count"],
    queryFn: () => getUnread(),
    refetchInterval: 30000,
  });

  const bulkUpdate = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: any }) => bulkUpdateJobStatus({ data: { ids, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      setSelectedIds(new Set());
    },
  });

  const bulkRemove = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteJobs({ data: { ids } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      setSelectedIds(new Set());
    },
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const published = data?.filter((j: any) => j.status === "published").length ?? 0;
  const unreadFeedback = (feedbackData as any)?.count ?? 0;

  const filteredData = statusFilter === "all" ? data : data?.filter((j: any) => j.status === statusFilter);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData?.length && filteredData?.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData?.map((j: any) => j.id) ?? []));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage curated job listings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/jobs/audit"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-yellow-600 hover:bg-accent hover:text-yellow-700"
          >
            <Activity className="h-4 w-4" /> Database Audit
          </Link>
          <Link
            to="/admin/jobs/bulk"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            Bulk Import
          </Link>
          <Link
            to="/admin/jobs/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
          >
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total jobs" value={data?.length ?? 0} />
        <Stat label="Published" value={published} />
        <Link to="/admin/feedback" className="glass rounded-2xl p-5 transition-colors hover:bg-accent">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Unread Feedback</p>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-2xl font-bold">{unreadFeedback}</p>
          {unreadFeedback > 0 && (
            <p className="mt-1 text-xs text-brand font-medium">View messages →</p>
          )}
        </Link>
      </div>

      {/* ── Ads Control ─────────────────────────────────────────────── */}
      <AdsControl />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">All Jobs</h2>
          <button
            onClick={() => {
              if (isSelectMode) setSelectedIds(new Set());
              setIsSelectMode(!isSelectMode);
            }}
            className="rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold hover:bg-muted transition-colors"
          >
            {isSelectMode ? "Cancel" : "Select"}
          </button>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSelectedIds(new Set());
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isSelectMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand/5 border border-brand/20 p-3 text-sm mb-4">
          <span className="font-semibold text-brand px-2">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-brand/20" />
          <button
            onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), status: "published" })}
            disabled={selectedIds.size === 0}
            className="rounded-md px-3 py-1.5 font-medium text-brand hover:bg-brand/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Publish
          </button>
          <button
            onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), status: "archived" })}
            disabled={selectedIds.size === 0}
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Archive
          </button>
          <button
            onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), status: "draft" })}
            disabled={selectedIds.size === 0}
            className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Unarchive (Draft)
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${selectedIds.size} jobs permanently?`)) {
                bulkRemove.mutate(Array.from(selectedIds));
              }
            }}
            disabled={selectedIds.size === 0}
            className="rounded-md px-3 py-1.5 font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Delete
          </button>
        </div>
      )}

      <div className="glass overflow-hidden rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {isSelectMode && (
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={(filteredData?.length ?? 0) > 0 && selectedIds.size === filteredData?.length}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-brand"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={isSelectMode ? 6 : 5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(filteredData || [])?.map((j: any) => (
              <tr key={j.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                {isSelectMode && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(j.id)}
                      onChange={() => toggleSelect(j.id)}
                      className="rounded border-border accent-brand"
                    />
                  </td>
                )}
                <td className="px-4 py-3 font-medium">
                  <Link to="/jobs/$slug" params={{ slug: j.slug }} className="hover:text-brand">{j.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{j.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    j.status === "published" ? "bg-brand/10 text-brand" : 
                    j.status === "draft" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" :
                    "bg-muted text-muted-foreground"
                  }`}>{j.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      to="/admin/jobs/$slug/edit"
                      params={{ slug: j.slug }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </Link>
                    {j.status === "draft" && (
                      <button
                        onClick={() => updateStatus.mutate({ id: j.id, status: "published" })}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-brand hover:bg-brand/10"
                      >
                        <Activity className="h-3 w-3" /> Publish
                      </button>
                    )}
                    {j.status === "archived" && (
                      <button
                        onClick={() => updateStatus.mutate({ id: j.id, status: "published" })}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-brand hover:bg-brand/10"
                      >
                        <Activity className="h-3 w-3" /> Restore
                      </button>
                    )}
                    {j.status !== "archived" && (
                      <button
                        onClick={() => updateStatus.mutate({ id: j.id, status: "archived" })}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Archive className="h-3 w-3" /> Archive
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${j.title}"?`)) remove.mutate(j.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Ads Control Widget ───────────────────────────────────────────────────────

function useCountdown(targetIso: string | null | undefined): string {
  const [label, setLabel] = useState("");
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!targetIso) {
      setLabel("");
      return;
    }

    function tick() {
      const diff = new Date(targetIso!).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setLabel(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [targetIso]);

  return label;
}

function AdsControl() {
  const qc = useQueryClient();
  const fetchConfig = useServerFn(getAdsConfig);
  const setEnabled = useServerFn(setAdsEnabled);

  const [showConfirm, setShowConfirm] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-ads-config"],
    queryFn: () => fetchConfig(),
    // Poll every 30s so the UI reflects auto-re-enable promptly
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => setEnabled({ data: { enabled } }),
    onSuccess: () => {
      setMutationError(null);
      // Invalidate both the admin and public-facing caches
      qc.invalidateQueries({ queryKey: ["admin-ads-config"] });
      qc.invalidateQueries({ queryKey: ["ads-global-config"] });
      setShowConfirm(false);
    },
    onError: (err: any) => {
      // Surface the actual error — do NOT pretend it worked.
      const msg =
        err?.message ??
        err?.toString() ??
        "Unknown error. Check browser console for details.";
      setMutationError(msg);
      console.error("[AdsControl] Toggle mutation failed:", msg, err);
      // Keep the confirm dialog open so the user can retry or cancel.
    },
  });

  const countdown = useCountdown(config?.ads_auto_enable_at);
  const adsOn = config?.ads_enabled !== false;

  const handleTurnOff = () => {
    setMutationError(null);
    setShowConfirm(true);
  };
  const handleTurnOn = () => {
    setMutationError(null);
    toggleMutation.mutate(true);
  };
  const handleConfirmOff = () => toggleMutation.mutate(false);
  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setMutationError(null);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${adsOn ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
            <Megaphone className={`h-5 w-5 ${adsOn ? "text-emerald-500" : "text-rose-500"}`} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Monetag Ads</p>
            {isLoading ? (
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">Loading…</p>
            ) : (
              <div className="mt-0.5 flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${adsOn ? "bg-emerald-500" : "bg-rose-500"}`}
                />
                <span className={`text-sm font-bold ${adsOn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {adsOn ? "ON" : "OFF"}
                </span>
                {!adsOn && countdown && (
                  <span className="text-xs text-muted-foreground">
                    — auto-enables in {countdown}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toggle button */}
        {!isLoading && (
          <div className="flex-shrink-0">
            {adsOn ? (
              <button
                id="ads-turn-off-btn"
                onClick={handleTurnOff}
                disabled={toggleMutation.isPending}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
              >
                Turn Off Ads
              </button>
            ) : (
              <button
                id="ads-turn-on-btn"
                onClick={handleTurnOn}
                disabled={toggleMutation.isPending}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
              >
                {toggleMutation.isPending ? "Turning On…" : "Turn On Ads"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline error display for Turn On path */}
      {mutationError && !showConfirm && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <strong>Error:</strong> {mutationError}
        </div>
      )}

      {/* Status detail row */}
      {!isLoading && !adsOn && (
        <div className="mt-4 rounded-lg border border-rose-200/60 bg-rose-50/60 px-4 py-3 dark:border-rose-900/30 dark:bg-rose-950/20">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
            Ads are globally disabled
          </p>
          <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-500/80">
            Monetag is not loading. Ad-block detection is inactive. All users can browse freely.
          </p>
          {countdown && (
            <p className="mt-2 font-mono text-sm font-semibold text-rose-700 dark:text-rose-400">
              Automatically re-enabling in: {countdown}
            </p>
          )}
        </div>
      )}

      {!isLoading && adsOn && (
        <p className="mt-3 text-xs text-muted-foreground">
          Monetag is active. Ad-block detection is running. Users without an ad blocker see ads normally; users with an ad blocker are shown the mandatory notice.
        </p>
      )}

      {/* Confirmation dialog — stays open on error so user can retry */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-base font-bold text-foreground">Turn off ads for all users?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ads will be disabled globally. Monetag will not load and no ad-block detection will run.
              Ads will automatically re-enable after <strong>1 hour</strong>.
            </p>

            {/* Show real error inside the dialog if the mutation failed */}
            {mutationError && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <strong>Failed:</strong> {mutationError}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                id="ads-confirm-cancel-btn"
                onClick={handleCancelConfirm}
                disabled={toggleMutation.isPending}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="ads-confirm-off-btn"
                onClick={handleConfirmOff}
                disabled={toggleMutation.isPending}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
              >
                {toggleMutation.isPending ? "Turning Off…" : mutationError ? "Retry" : "Turn Off Ads"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────


function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
