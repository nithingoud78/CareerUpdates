import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getSiteSettings, updateSiteSettings, siteSettingsSchema } from "@/lib/site-settings.functions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/admin/site-settings")({
  component: SiteSettings,
});

type FormValues = z.infer<typeof siteSettingsSchema>;

function SiteSettings() {
  const get = useServerFn(getSiteSettings);
  const update = useServerFn(updateSiteSettings);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["site-settings"], queryFn: () => get() });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => update({ data: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      const btn = document.getElementById("save-btn");
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "Saved!";
        btn.classList.add("bg-green-600", "hover:bg-green-700");
        setTimeout(() => {
          btn.innerText = "Save Settings";
          btn.classList.remove("bg-green-600", "hover:bg-green-700");
        }, 2000);
      }
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      site_name: "",
      contact_email: "",
      telegram_url: "",
      whatsapp_url: "",
      instagram_url: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        site_name: data.site_name || "",
        contact_email: data.contact_email || "",
        telegram_url: data.telegram_url || "",
        whatsapp_url: data.whatsapp_url || "",
        instagram_url: data.instagram_url || "",
      });
    }
  }, [data, form.reset]);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading site settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Site Settings</h2>
      </div>

      <div className="max-w-2xl rounded-xl border border-border/50 bg-surface/50 p-6 backdrop-blur-xl">
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Site Name</label>
              <input
                {...form.register("site_name")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {form.formState.errors.site_name && (
                <p className="text-sm text-red-500">{form.formState.errors.site_name.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Contact Email</label>
              <input
                {...form.register("contact_email")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="hello@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Telegram URL</label>
              <input
                {...form.register("telegram_url")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://t.me/yourchannel"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">WhatsApp URL</label>
              <input
                {...form.register("whatsapp_url")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://wa.me/..."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Instagram URL</label>
              <input
                {...form.register("instagram_url")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>

          <button
            id="save-btn"
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
