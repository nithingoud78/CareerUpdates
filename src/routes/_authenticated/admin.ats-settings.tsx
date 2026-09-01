/**
 * /admin/ats-settings
 *
 * ATS Checker AI configuration — COMPLETELY SEPARATE from /admin/settings
 * which controls the global AI provider (job extraction, blog generation).
 *
 * This page ONLY configures the ATS checker's AI.
 * Changing settings here has ZERO effect on job extraction or other AI features.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  getAtsSettings,
  saveAtsSettings,
  checkAtsHealth,
  ATS_PROVIDERS,
  ATS_DEFAULT_URLS,
  ATS_DEFAULT_MODELS,
} from "@/lib/ats-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/ats-settings")({
  component: AtsSettingsPage,
});

function AtsSettingsPage() {
  const get = useServerFn(getAtsSettings);
  const save = useServerFn(saveAtsSettings);
  const check = useServerFn(checkAtsHealth);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ats-settings"],
    queryFn: () => get(),
  });

  const { data: health, isFetching: isCheckingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ["ats-health"],
    queryFn: () => check(),
    refetchOnWindowFocus: false,
    enabled: false, // Only fetch on button click
  });

  const [form, setForm] = useState({
    provider: "gemini",
    model: "gemini-1.5-flash",
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai",
    api_key: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider,
        model: data.model,
        base_url: data.base_url ?? ATS_DEFAULT_URLS[data.provider] ?? "",
        api_key: "",
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          provider: form.provider,
          model: form.model,
          base_url: form.base_url || null,
          api_key: form.api_key || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ats-settings"] });
      qc.invalidateQueries({ queryKey: ["ats-health"] });
    },
  });

  function handleProviderChange(provider: string) {
    setForm({
      ...form,
      provider,
      base_url: ATS_DEFAULT_URLS[provider] ?? "",
      model: ATS_DEFAULT_MODELS[provider] ?? "",
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/50" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">ATS Checker Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the AI provider used exclusively for the ATS Resume Checker.
        </p>
      </header>

      {/* Isolation warning */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/50 dark:bg-amber-950/30">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Isolated Configuration</p>
          <p className="mt-0.5 text-amber-700 dark:text-amber-400">
            These settings are <strong>completely separate</strong> from the Global AI Settings
            (used for job extraction and content generation). Changes here only affect the ATS Checker.
          </p>
        </div>
      </div>

      <section className="glass space-y-5 rounded-2xl p-5">
        {/* Health status */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">ATS AI Service Status</p>
              <p className="text-xs text-muted-foreground">Connection health for the ATS checker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCheckingHealth ? (
              <span className="text-sm text-muted-foreground">Checking…</span>
            ) : health?.status === "Connected" ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Connected
              </div>
            ) : health?.status === "Rate Limited" ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <AlertTriangle className="h-4 w-4" /> Rate Limited
              </div>
            ) : health?.status === "Invalid Key" ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <AlertTriangle className="h-4 w-4" /> Invalid Key
              </div>
            ) : health?.status === "Not Configured" ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Info className="h-4 w-4" /> Not Configured
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" /> {health?.status ?? "Unknown"}
              </div>
            )}
            <button
              id="test-ats-connection-btn"
              onClick={() => refetchHealth()}
              disabled={isCheckingHealth}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              Test Connection
            </button>
          </div>
        </div>

        {health?.error && (
          <p className={`rounded-lg p-2 text-xs ${
            health.status === 'Rate Limited' || health.status === 'Invalid Key' 
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30' 
              : 'bg-red-50 text-red-600 dark:bg-red-950/30'
          }`}>
            {health.error}
          </p>
        )}

        {health?.status === "Connected" && (
          <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700 dark:bg-green-950/30">
            Connected to {health.provider} / {health.model}
          </p>
        )}

        {/* Provider select */}
        <div>
          <label htmlFor="ats-provider" className="text-xs font-medium text-muted-foreground">
            ATS AI Provider
          </label>
          <select
            id="ats-provider"
            value={form.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ATS_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label htmlFor="ats-model" className="text-xs font-medium text-muted-foreground">
            Model
          </label>
          <input
            id="ats-model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. gemini-1.5-flash"
          />
        </div>

        {/* Base URL */}
        <div>
          <label htmlFor="ats-base-url" className="text-xs font-medium text-muted-foreground">
            Base URL
          </label>
          <input
            id="ats-base-url"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://api.openai.com/v1"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave blank to use the default URL for the selected provider.
          </p>
        </div>

        {/* API Key */}
        <div>
          <label htmlFor="ats-api-key" className="text-xs font-medium text-muted-foreground">
            API Key
          </label>
          <input
            id="ats-api-key"
            type="password"
            value={form.api_key}
            onChange={(e) => setForm({ ...form, api_key: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={data?._has_api_key ? "•••••••• (saved)" : "Enter API key…"}
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave blank to keep the existing key. The key is stored securely and never exposed in the UI.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="save-ats-settings-btn"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {saveMut.isPending ? "Saving…" : "Save Settings"}
          </button>
          <button
            id="test-ats-connection-btn-2"
            onClick={() => refetchHealth()}
            disabled={isCheckingHealth}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            {isCheckingHealth ? "Testing…" : "Test Connection"}
          </button>
        </div>

        {saveMut.isSuccess && (
          <p className="text-xs text-brand">Settings saved. The ATS checker will use this provider.</p>
        )}
        {saveMut.isError && (
          <p className="text-xs text-red-600">
            {(saveMut.error as Error)?.message ?? "Failed to save settings."}
          </p>
        )}
      </section>

      {/* Info box */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="space-y-1">
          <p>
            The ATS API key is used only for resume analysis requests from the <strong>/ats-checker</strong> page.
            It is stored server-side and never exposed to the browser.
          </p>
          <p>
            The existing Global AI Settings (<strong>/admin/settings</strong>) remain completely unaffected
            by any changes made here.
          </p>
        </div>
      </div>
    </div>
  );
}
