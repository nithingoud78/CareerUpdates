import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/site-settings")({
  component: SiteSettings,
});

function SiteSettings() {
  const get = useServerFn(getSiteSettings);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => get() });

  const [form, setForm] = useState({
    contact_email: "",
    telegram_url: "",
    whatsapp_url: "",
    instagram_url: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        contact_email: data.contact_email ?? "",
        telegram_url: data.telegram_url ?? "",
        whatsapp_url: data.whatsapp_url ?? "",
        instagram_url: data.instagram_url ?? "",
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          contact_email: form.contact_email || null,
          telegram_url: form.telegram_url || null,
          whatsapp_url: form.whatsapp_url || null,
          instagram_url: form.instagram_url || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Site settings saved successfully");
    },
    onError: (err) => {
      toast.error("Failed to save site settings", { description: err.message });
    }
  });

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure contact and social links used across the site.
        </p>
      </header>

      <section className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Contact Email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. hello@careerupdates.app"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Telegram URL</label>
          <input
            type="url"
            value={form.telegram_url}
            onChange={(e) => setForm({ ...form, telegram_url: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. https://t.me/yourchannel"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">WhatsApp Channel URL</label>
          <input
            type="url"
            value={form.whatsapp_url}
            onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. https://whatsapp.com/channel/..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Instagram URL</label>
          <input
            type="url"
            value={form.instagram_url}
            onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. https://instagram.com/..."
          />
        </div>

        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
        >
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </button>
      </section>
    </div>
  );
}
