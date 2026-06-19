import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getAiSettings, saveAiSettings } from "@/lib/ai-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: Settings,
});

const PROVIDERS = [
  { value: "lovable", label: "Lovable AI Gateway (recommended, no key needed)" },
  { value: "gemini", label: "Google Gemini (OpenAI-compatible)" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "Custom OpenAI-compatible" },
];

const DEFAULT_URLS: Record<string, string> = {
  lovable: "https://ai.gateway.lovable.dev/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  openai: "https://api.openai.com/v1",
  custom: "",
};

function Settings() {
  const get = useServerFn(getAiSettings);
  const save = useServerFn(saveAiSettings);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["ai-settings"], queryFn: () => get() });

  const [form, setForm] = useState({
    provider: "lovable",
    model: "google/gemini-3-flash-preview",
    base_url: "https://ai.gateway.lovable.dev/v1",
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-settings"] }),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">AI Provider Settings</h1>
        <p className="text-sm text-muted-foreground">
          Switch between Lovable AI Gateway, Gemini, OpenRouter, and any OpenAI-compatible API.
        </p>
      </header>

      <section className="glass space-y-4 rounded-2xl p-5">
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

        {form.provider !== "lovable" && (
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
      </section>
    </div>
  );
}
