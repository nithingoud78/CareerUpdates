import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MessageCircle, Send, Instagram } from "lucide-react";
import { useState } from "react";
import { getSiteSettings } from "@/lib/site-settings.functions";

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
  const [sent, setSent] = useState(false);
  
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Contact</p>
        <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Get in touch</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Questions, corrections, or partnership ideas? We typically respond within 1-2 business days.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="glass space-y-4 rounded-2xl p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Subject" name="subject" required />
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                required
                rows={5}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
            <button
              type="submit"
              disabled={sent}
              className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {sent ? "Thanks — we'll be in touch" : "Send message"}
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

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
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
      <a href={href} target="_blank" rel="noreferrer" className="glass flex items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-brand/5">
        {inner}
      </a>
    );
  }

  return (
    <div className="glass flex items-start gap-3 rounded-2xl p-4">
      {inner}
    </div>
  );
}
