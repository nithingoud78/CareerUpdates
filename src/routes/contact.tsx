import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MessageCircle, Send, Instagram, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings } from "@/lib/site-settings.functions";
import { submitFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/contact")({
  loader: async () => {
    try {
      const settings = await getSiteSettings();
      return { settings };
    } catch {
      return { settings: null };
    }
  },
  head: () => ({
    meta: [
      { title: "Contact — Career Updates" },
      { name: "description", content: "Reach out to Career Updates for partnership, content corrections or general queries." },
      { property: "og:title", content: "Contact — Career Updates" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const { settings } = useLoaderData({ from: "/contact" }) as any;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useServerFn(submitFeedback);

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        },
      }),
    onSuccess: () => {
      setForm({ name: "", email: "", subject: "", message: "" });
      setErrors({});
      setToast({ type: "success", message: "Thank you! Your message has been received." });
      setTimeout(() => setToast(null), 5000);
    },
    onError: (err: any) => {
      setToast({ type: "error", message: err.message ?? "Something went wrong. Please try again." });
      setTimeout(() => setToast(null), 5000);
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.length < 10) e.message = "Message must be at least 10 characters";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2 = validate();
    setErrors(e2);
    if (Object.keys(e2).length > 0) return;
    mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Contact</p>
        <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Get in touch</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Questions, corrections, or partnership ideas? We typically respond within 1-2 business days.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                name="name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                error={errors.name}
                required
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                error={errors.email}
                required
              />
            </div>
            <Field
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={(v) => setForm((f) => ({ ...f, subject: v }))}
              error={errors.subject}
              required
            />
            <div>
              <label className="text-sm font-medium" htmlFor="message">Message</label>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-brand ${
                  errors.message ? "border-destructive" : "border-input"
                }`}
              />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {mutation.isPending ? "Sending…" : "Send message"}
            </button>
          </form>

          <aside className="space-y-3">
            <ContactBox
              icon={Mail}
              label="Email"
              value={settings?.contact_email || "careerupdates.in@gmail.com"}
              href={`mailto:${settings?.contact_email || "careerupdates.in@gmail.com"}`}
            />
            <ContactBox
              icon={Send}
              label="Telegram"
              value={settings?.telegram_url || "https://t.me/careerupdate_in"}
              href={settings?.telegram_url || "https://t.me/careerupdate_in"}
            />
            <ContactBox
              icon={MessageCircle}
              label="WhatsApp"
              value={settings?.whatsapp_url || "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K"}
              href={settings?.whatsapp_url || "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K"}
            />
            <ContactBox
              icon={Instagram}
              label="Instagram"
              value={settings?.instagram_url || "https://www.instagram.com/careerupdates_in?igsh=cXp1NTJ4cXZmMW92"}
              href={settings?.instagram_url || "https://www.instagram.com/careerupdates_in?igsh=cXp1NTJ4cXZmMW92"}
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  label, name, type = "text", value, onChange, error, required,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-brand ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ContactBox({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="glass flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-brand/5">
        {inner}
      </a>
    );
  }

  return <div className="glass flex items-start gap-3 rounded-2xl p-4">{inner}</div>;
}
