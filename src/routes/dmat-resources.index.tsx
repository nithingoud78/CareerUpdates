import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, FileText, ChevronRight, BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { ScrollReveal } from "@/components/scroll-reveal";

export const Route = createFileRoute("/dmat-resources/")({
  head: () => ({
    meta: [
      { title: "dMAT Resources — Questions & Packs | Career Updates" },
      { name: "description", content: "Explore our collection of dMAT module wise questions and complete packs." },
    ],
  }),
  component: DmatResourcesLanding,
});

function DmatResourcesLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]" />
        </div>
        <ScrollReveal className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6">
          <p className="mb-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            Digital Resources
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            dMAT <span className="text-brand">Resources</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Master your preparation with our curated module-wise questions and comprehensive study packs designed for the dMAT.
          </p>
        </ScrollReveal>
      </section>

      {/* Main Options */}
      <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          
          <ScrollReveal delay={0.1}>
            <Link
              to="/dmat-resources/modules"
              className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-8 transition-all hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">Module Wise Questions</h2>
              <p className="mb-8 flex-1 text-muted-foreground">
                Focus on specific areas with individual modules. Perfect for targeting your weak points or studying one subject at a time.
              </p>
              <div className="flex items-center text-sm font-semibold text-brand">
                Browse Modules
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <Link
              to="/dmat-resources/packs"
              className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-8 transition-all hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Package className="h-7 w-7" />
              </div>
              <h2 className="mb-3 text-2xl font-bold">Complete Packs</h2>
              <p className="mb-8 flex-1 text-muted-foreground">
                Get everything you need in one comprehensive bundle. Save money and get all modules bundled together in one easy download.
              </p>
              <div className="flex items-center text-sm font-semibold text-brand">
                Browse Packs
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </ScrollReveal>
          
        </div>
      </main>

      <SiteFooter />
      <StickySocial />
    </div>
  );
}
