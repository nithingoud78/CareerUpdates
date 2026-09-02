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
  saveAtsPricingSettings,
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
  const savePricing = useServerFn(saveAtsPricingSettings);
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

  const [pricingForm, setPricingForm] = useState({
    price: 5,
    original_price: 299,
    is_free: false,
  });

  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider,
        model: data.model,
        base_url: data.base_url ?? ATS_DEFAULT_URLS[data.provider] ?? "",
        api_key: "",
      });
      setPricingForm({
        price: data.actual_price ?? 5,
        original_price: data.original_price ?? 299,
        is_free: !!data.is_free,
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

  const savePricingMut = useMutation({
    mutationFn: () =>
      savePricing({
        data: {
          price: pricingForm.price,
          original_price: pricingForm.original_price,
          is_free: pricingForm.is_free,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ats-settings"] });
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
          <div className="flex items-center gap-4">
            {isCheckingHealth ? (
              <span className="text-sm text-muted-foreground">Checking…</span>
            ) : (() => {
              const status = health?.status || data?.connection_status;
              
              if (status === "Not Configured" || !status || status === "unknown") {
                return (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" /> Not Configured
                  </div>
                );
              }
              
              const isSuccess = status === "success" || status === "Connected" || status?.startsWith("Connected to");
              const provider = health?.provider || data?.last_tested_provider || data?.provider;
              const model = health?.model || data?.last_tested_model || data?.model;
              const timestampIso = health?.timestamp || data?.last_tested_at;
              const errorMsg = health?.error || data?.last_error;
              
              const formatTime = (isoString?: string) => {
                if (!isoString) return "";
                return new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(isoString));
              };

              return (
                <div className="flex flex-col gap-1 text-sm text-left">
                  <div className="flex items-center gap-1.5">
                    {isSuccess ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <span className={isSuccess ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-red-700 dark:text-red-400 font-medium"}>
                      {isSuccess ? "Connected to" : "Connection disconnected to"} {provider} / {model}
                    </span>
                  </div>
                  {timestampIso && (
                    <div className="text-[11px] text-muted-foreground ml-5.5">
                      Last test connection: {formatTime(timestampIso)}
                    </div>
                  )}
                  {!isSuccess && errorMsg && (
                    <div className="text-[11px] text-red-600 dark:text-red-400 ml-5.5 mt-0.5">
                      {errorMsg}
                    </div>
                  )}
                </div>
              );
            })()}
            <button
              id="test-ats-connection-btn"
              onClick={() => refetchHealth()}
              disabled={isCheckingHealth}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50 h-fit"
            >
              Test Connection
            </button>
          </div>
        </div>

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

      <section className="glass space-y-5 rounded-2xl p-5">
        <h2 className="font-semibold">ATS Checker Pricing</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="ats-original-price" className="text-xs font-medium text-muted-foreground">
                Original Price (₹)
              </label>
              <input
                id="ats-original-price"
                type="number"
                min="1"
                value={pricingForm.original_price}
                onChange={(e) => setPricingForm({ ...pricingForm, original_price: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={pricingForm.is_free}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="ats-price" className="text-xs font-medium text-muted-foreground">
                ATS Checker Price (₹)
              </label>
              <input
                id="ats-price"
                type="number"
                min="1"
                value={pricingForm.price}
                onChange={(e) => setPricingForm({ ...pricingForm, price: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={pricingForm.is_free}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pricingForm.is_free}
              onChange={(e) => setPricingForm({ ...pricingForm, is_free: e.target.checked })}
              className="rounded border-input text-brand focus:ring-brand"
            />
            <span className="text-sm font-medium">Make ATS Checker Free</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => savePricingMut.mutate()}
              disabled={savePricingMut.isPending}
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {savePricingMut.isPending ? "Saving…" : "Save Pricing"}
            </button>
          </div>

          {savePricingMut.isSuccess && (
            <p className="text-xs text-brand">Pricing settings saved.</p>
          )}
          {savePricingMut.isError && (
            <p className="text-xs text-red-600">
              {(savePricingMut.error as Error)?.message ?? "Failed to save pricing settings."}
            </p>
          )}
        </div>
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
