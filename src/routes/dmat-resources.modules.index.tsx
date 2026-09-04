import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { TemplateCard } from "@/components/career-tools/template-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { getPublishedDmatModules } from "@/lib/career-tools.functions";
import { ScrollReveal } from "@/components/scroll-reveal";

const SITE_URL = "https://careerupdates.co.in";

export const Route = createFileRoute("/dmat-resources/modules/")({
  head: () => ({
    meta: [
      { title: "dMAT Module Wise Questions | Career Updates" },
      { name: "description", content: "Download individual dMAT module wise questions." },
      { property: "og:title", content: "dMAT Module Wise Questions | Career Updates" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/dmat-resources/modules` },
      { property: "og:image", content: `${SITE_URL}/careerupdates-share-2026.png` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/dmat-resources/modules` }],
  }),
  component: DmatModulesList,
});

function DmatModulesList() {
  const getModules = useServerFn(getPublishedDmatModules);
  const { data: modules, isLoading } = useQuery({
    queryKey: ["published-dmat-modules"],
    queryFn: () => getModules(),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]" />
        </div>
        <ScrollReveal className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:px-6">
          <Link to="/dmat-resources" className="mb-3 inline-flex hover:underline rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            dMAT Resources
          </Link>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Module Wise <span className="text-brand">Questions</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Focus your preparation with our individual dMAT module question sets.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/dmat-resources/packs"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              <Package className="h-3.5 w-3.5" /> View Complete Packs
            </Link>
          </div>
        </ScrollReveal>
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
        {!isLoading && (!modules || modules.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">No modules published yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon.</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && modules && modules.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                <span className="text-brand">{modules.length}</span> Module{modules.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((t) => (
                <TemplateCard key={t.id} template={t as any} baseUrl="/dmat-resources/modules/$slug" />
              ))}
            </div>
          </ScrollReveal>
        )}

        <AdSlot placement="homeMiddle" className="mt-12" />

      </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}
