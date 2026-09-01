import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { BundleCard } from "@/components/career-tools/bundle-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { getPublishedBundles } from "@/lib/career-tools.functions";

const SITE_URL = "https://careerupdates.co.in";

export const Route = createFileRoute("/resume-bundles/")({
  head: () => ({
    meta: [
      { title: "Resume Bundles — Complete Career Toolkits | Career Updates" },
      { name: "description", content: "Get complete career toolkits: resume templates, cover letters, referral messages, and cold email templates in one bundle. Starting at ₹79." },
      { property: "og:title", content: "Resume Bundles — Career Toolkits | Career Updates" },
      { property: "og:description", content: "Complete job application bundles with resume, cover letter, and outreach templates. Starting at ₹79." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/resume-bundles` },
      { property: "og:image", content: `${SITE_URL}/careerupdates-share-2026.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/resume-bundles` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Resume Bundles", item: `${SITE_URL}/resume-bundles` },
          ],
        }),
      },
    ],
  }),
  component: ResumeBundles,
});

function ResumeBundles() {
  const getBundles = useServerFn(getPublishedBundles);
  const { data: bundles, isLoading } = useQuery({
    queryKey: ["published-bundles"],
    queryFn: () => getBundles(),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:px-6">
          <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Career Tools
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Resume <span className="text-brand">Bundles</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Complete career toolkits that cover every step of your job application — from crafting your resume to reaching out to recruiters and employees at your target companies.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/resume-templates"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              <FileText className="h-3.5 w-3.5" /> Individual Templates
            </Link>
            <Link
              to="/ats-checker"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Check My Resume →
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <AdSlot placement="homeTop" className="mb-8" />

        {/* What's in a bundle */}
        <section className="mb-10 rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold">What's Included in a Bundle?</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Resume Templates", desc: "ATS-friendly, recruiter-tested formats", icon: "📄" },
              { label: "Cover Letter Templates", desc: "Professional, role-specific cover letter structure", icon: "✉️" },
              { label: "Referral Message Scripts", desc: "LinkedIn and email outreach for employee referrals", icon: "🤝" },
              { label: "Cold Email Templates", desc: "Direct outreach to hiring managers and recruiters", icon: "📬" },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-4 text-center">
                <div className="mb-2 text-2xl">{item.icon}</div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="glass animate-pulse rounded-2xl">
                <div className="aspect-[3/2] w-full rounded-t-2xl bg-muted/50" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-muted/50" />
                  <div className="h-3 w-full rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!bundles || bundles.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">No bundles published yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon — bundles are coming.</p>
            <Link
              to="/resume-templates"
              className="mt-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Browse Individual Templates
            </Link>
          </div>
        )}

        {/* Bundles grid */}
        {!isLoading && bundles && bundles.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                <span className="text-brand">{bundles.length}</span> Bundle{bundles.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {bundles.map((b) => (
                <BundleCard key={b.id} bundle={b as any} />
              ))}
            </div>
          </>
        )}

        <AdSlot placement="homeMiddle" className="mt-12" />

        {/* Cross-links */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            to="/resume-templates"
            className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
          >
            <FileText className="h-8 w-8 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">Individual Templates</p>
              <p className="text-sm text-muted-foreground">Pick just the template you need</p>
            </div>
          </Link>
          <Link
            to="/ats-checker"
            className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
          >
            <FileText className="h-8 w-8 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">ATS Resume Checker</p>
              <p className="text-sm text-muted-foreground">Check how well your resume matches a job description</p>
            </div>
          </Link>
        </div>
      </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}
