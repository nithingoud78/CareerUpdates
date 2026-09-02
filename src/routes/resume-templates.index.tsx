import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { TemplateCard } from "@/components/career-tools/template-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { getPublishedTemplates } from "@/lib/career-tools.functions";

const SITE_URL = "https://careerupdates.co.in";

export const Route = createFileRoute("/resume-templates/")({
  head: () => ({
    meta: [
      { title: "Resume Templates — ATS-Friendly Templates | Career Updates" },
      { name: "description", content: "Download professional, ATS-friendly resume templates for freshers and experienced professionals. Starting at ₹29. Clean, recruiter-ready formats." },
      { property: "og:title", content: "Resume Templates — ATS-Friendly | Career Updates" },
      { property: "og:description", content: "Professional resume templates starting at ₹29. ATS-friendly layouts for freshers, engineers, and professionals." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/resume-templates` },
      { property: "og:image", content: `${SITE_URL}/careerupdates-share-2026.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Resume Templates — Career Updates" },
      { name: "twitter:description", content: "ATS-friendly resume templates starting at ₹29." },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/resume-templates` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Resume Templates", item: `${SITE_URL}/resume-templates` },
          ],
        }),
      },
    ],
  }),
  component: ResumeTemplates,
});

function ResumeTemplates() {
  const getTemplates = useServerFn(getPublishedTemplates);
  const { data: templates, isLoading } = useQuery({
    queryKey: ["published-templates"],
    queryFn: () => getTemplates(),
  });

  const categories = [...new Set((templates ?? []).map((t) => t.category).filter(Boolean))];
  const [activeCategory, setActiveCategory] = ["All", () => {}] as any;

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
            Resume <span className="text-brand">Templates</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Professional, ATS-friendly resume templates designed to help you get noticed. Clean layouts that recruiters love and applicant tracking systems can read.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/resume-bundles"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              <Package className="h-3.5 w-3.5" /> View Bundles
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

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass animate-pulse rounded-2xl">
                <div className="aspect-[3/2] w-full rounded-t-2xl bg-muted/50" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/4 rounded bg-muted/50" />
                  <div className="h-4 w-3/4 rounded bg-muted/50" />
                  <div className="h-3 w-full rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!templates || templates.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">No templates published yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon — we're adding new templates.</p>
            <Link
              to="/ats-checker"
              className="mt-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Check Your Resume
            </Link>
          </div>
        )}

        {/* Template grid */}
        {!isLoading && templates && templates.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                <span className="text-brand">{templates.length}</span> Template{templates.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t as any} />
              ))}
            </div>
          </>
        )}

        <AdSlot placement="homeMiddle" className="mt-12" />

        {/* Cross-links */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link
            to="/resume-bundles"
            className="glass flex items-center gap-4 rounded-2xl p-5 transition-all hover:shadow-sm hover:shadow-brand/10"
          >
            <Package className="h-8 w-8 shrink-0 text-brand" />
            <div>
              <p className="font-semibold">Resume Packs</p>
              <p className="text-sm text-muted-foreground">Get resume + cover letter + referral templates together</p>
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
