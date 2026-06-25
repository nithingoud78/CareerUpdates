import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAiSettings, saveAiSettings } from "@/lib/ai-settings.functions";
import { checkAiHealth } from "@/lib/ai.functions";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Settings,
});

const PROVIDERS = [
  { value: "default", label: "Default Provider (recommended, no key needed)" },
  { value: "gemini", label: "Google Gemini (OpenAI-compatible)" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "Custom OpenAI-compatible" },
];

const DEFAULT_URLS: Record<string, string> = {
  default: "",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  custom: "",
};

function Settings() {
  const get = useServerFn(getAiSettings);
  const save = useServerFn(saveAiSettings);
  const checkHealth = useServerFn(checkAiHealth);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["ai-settings"], queryFn: () => get() });
  const { data: health, isFetching: isCheckingHealth } = useQuery({ 
    queryKey: ["ai-health"], 
    queryFn: () => checkHealth(),
    refetchOnWindowFocus: false,
  });

  const [form, setForm] = useState({
    provider: "default",
    model: "google/gemini-3-flash-preview",
    base_url: "",
    api_key: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        provider: data.provider,
        model: data.model,
        base_url: data.base_url ?? "",
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
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      qc.invalidateQueries({ queryKey: ["ai-health"] });
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">AI Provider Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure the AI provider used for extraction, summarization, and content processing.
        </p>
      </header>

      <section className="glass space-y-4 rounded-2xl p-5">
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">AI Service Status</p>
              <p className="text-xs text-muted-foreground">Current connection health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCheckingHealth ? (
              <span className="text-sm font-medium text-muted-foreground">Checking...</span>
            ) : health?.status === "Connected" ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Connected
              </div>
            ) : health?.status === "Invalid Key" ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <AlertTriangle className="h-4 w-4" /> Invalid Key
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                <XCircle className="h-4 w-4" /> Unavailable
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Provider</label>
          <select
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value, base_url: DEFAULT_URLS[e.target.value] ?? form.base_url })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. google/gemini-3-flash-preview"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Base URL</label>
          <input
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://api.openai.com/v1"
          />
        </div>

        {form.provider !== "default" && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">API Key</label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={data?.api_key ? "•••••••• (saved)" : "sk-…"}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Leave blank to keep the existing key.
            </p>
          </div>
        )}

        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
        >
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </button>
        {saveMut.isSuccess && (
          <p className="text-xs text-brand">Saved. New extractions will use this provider.</p>
        )}
        {health?.error && (
          <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/50">
            {health.error}
          </p>
        )}
      </section>
    </div>
  );
}
