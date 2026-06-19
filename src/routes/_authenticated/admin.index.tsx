import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, Archive, Activity } from "lucide-react";
import { listAllJobs, deleteJob, updateJobStatus } from "@/lib/admin-jobs.functions";

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
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateJobStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const published = data?.filter((j: any) => j.status === "published").length ?? 0;

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Total jobs" value={data?.length ?? 0} />
        <Stat label="Published" value={published} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">All Jobs</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="expired">Expired</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {(statusFilter === "all" ? data : data?.filter((j: any) => j.status === statusFilter))?.map((j: any) => (
              <tr key={j.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link to="/jobs/$slug" params={{ slug: j.slug }} className="hover:text-brand">{j.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{j.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{j.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    j.status === "published" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                  }`}>{j.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
