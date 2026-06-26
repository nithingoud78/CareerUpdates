import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Database, ImageOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getLogoMigrationStatus,
  migrateAllLogos,
} from "@/lib/logo-storage.functions";

export const Route = createFileRoute("/_authenticated/admin/site-settings/logo-migration")({
  component: LogoMigrationPage,
});

function LogoMigrationPage() {
  const getStatus = useServerFn(getLogoMigrationStatus);
  const runMigration = useServerFn(migrateAllLogos);
  const qc = useQueryClient();

  const [lastResult, setLastResult] = useState<{
    processed: number;
    succeeded: number;
    failed: number;
    message: string;
  } | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["logo-migration-status"],
    queryFn: () => getStatus(),
    refetchInterval: 10_000,
  });

  const migrate = useMutation({
    mutationFn: () => runMigration(),
    onSuccess: (result) => {
      if (result.success) {
        setLastResult({
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          message: result.message ?? "",
        });
      }
      qc.invalidateQueries({ queryKey: ["logo-migration-status"] });
    },
  });

  const pct =
    status && status.total > 0
      ? Math.round((status.cached / status.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Company Logo Storage Migration</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Downloads company logos from external sources (Clearbit, Google Favicon API) and stores
          them permanently in Supabase Storage. Once stored, logos load instantly from our own CDN
          with no third-party dependency.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Database className="h-5 w-5 text-brand" />}
          label="Total Jobs"
          value={isLoading ? "…" : String(status?.total ?? 0)}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Logos Cached"
          value={isLoading ? "…" : String(status?.cached ?? 0)}
        />
        <StatCard
          icon={<ImageOff className="h-5 w-5 text-amber-500" />}
          label="Pending"
          value={isLoading ? "…" : String(status?.pending ?? 0)}
        />
      </div>

      {/* Progress bar */}
      {status && status.total > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Cache coverage</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-brand transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Last migration result */}
      {lastResult && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            lastResult.failed === 0
              ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
              : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
          }`}
        >
          {lastResult.failed === 0 ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <p className="font-medium">{lastResult.message}</p>
            <p className="mt-0.5 text-xs opacity-75">
              {lastResult.processed} processed · {lastResult.succeeded} succeeded ·{" "}
              {lastResult.failed} failed (will use live fallback)
            </p>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => migrate.mutate()}
          disabled={migrate.isPending || status?.pending === 0}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${migrate.isPending ? "animate-spin" : ""}`} />
          {migrate.isPending
            ? "Migrating logos…"
            : status?.pending === 0
            ? "All logos cached ✓"
            : `Cache ${status?.pending ?? "pending"} logos`}
        </button>
        {status && status.pending > 200 && (
          <p className="text-xs text-muted-foreground">
            Processes up to 200 per run. Run again after it completes.
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground space-y-2">
        <h3 className="font-semibold text-foreground">How it works</h3>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Fetches jobs with no cached logo (up to 200 per run).</li>
          <li>Downloads each logo from Clearbit or Google Favicon API.</li>
          <li>Validates MIME type and file size (max 500 KB).</li>
          <li>Uploads to Supabase Storage bucket <code className="text-brand">company-logos</code>.</li>
          <li>Writes the permanent public URL to <code className="text-brand">company_logo_storage_url</code>.</li>
          <li>Future renders use the storage URL — no external CDN dependency.</li>
        </ol>
        <p className="pt-1 text-xs">
          Jobs where all sources fail are skipped gracefully and will display initials or favicon.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
