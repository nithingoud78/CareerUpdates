import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { auditAllJobs, recleanJobDescription } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/admin/jobs/audit")({
  component: AuditDashboard,
});

function AuditDashboard() {
  const auditFn = useServerFn(auditAllJobs);
  const recleanFn = useServerFn(recleanJobDescription);
  const qc = useQueryClient();
  const [cleaningId, setCleaningId] = useState<string | null>(null);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["admin-jobs-audit"],
    queryFn: () => auditFn(),
  });

  const reclean = useMutation({
    mutationFn: (id: string) => recleanFn({ data: { id } }),
    onMutate: (id) => setCleaningId(id),
    onSuccess: () => {
      setCleaningId(null);
      refetch();
    },
    onError: (e: any) => {
      setCleaningId(null);
      alert("Re-clean failed: " + e.message);
    }
  });

  const cleanCount = jobs?.filter((j: any) => j.category === "clean").length || 0;
  const suspiciousCount = jobs?.filter((j: any) => j.category === "suspicious").length || 0;
  const brokenCount = jobs?.filter((j: any) => j.category === "broken").length || 0;

  const displayJobs = jobs?.filter((j: any) => j.category !== "clean") || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold">Database Audit</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Detect and repair polluted job descriptions.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Rescan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wider font-semibold">Clean</p>
          </div>
          <p className="text-2xl font-bold">{cleanCount}</p>
        </div>
        <div className="glass rounded-2xl p-5 border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wider font-semibold">Suspicious</p>
          </div>
          <p className="text-2xl font-bold">{suspiciousCount}</p>
        </div>
        <div className="glass rounded-2xl p-5 border-l-4 border-red-500">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <XCircle className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wider font-semibold">Broken</p>
          </div>
          <p className="text-2xl font-bold">{brokenCount}</p>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Job Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Reasons</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Running audit...</td></tr>
            )}
            {!isLoading && displayJobs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No broken or suspicious jobs found!</td></tr>
            )}
            {displayJobs.map((j: any) => (
              <tr key={j.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  <div>{j.title}</div>
                  <div className="text-xs text-muted-foreground">{j.company}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    j.category === "broken" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    Score: {j.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <ul className="list-disc pl-4">
                    {j.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => reclean.mutate(j.id)}
                    disabled={cleaningId === j.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
                  >
                    {cleaningId === j.id ? (
                      <><RefreshCw className="h-3 w-3 animate-spin" /> Cleaning...</>
                    ) : (
                      "Re-clean Description"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
