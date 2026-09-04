import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { BundleDetailView } from "@/components/career-tools/bundle-detail-view";
import { getDmatBundleBySlug } from "@/lib/career-tools.functions";

const SITE_URL = "https://careerupdates.co.in";

export const Route = createFileRoute("/dmat-resources/packs/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `dMAT Complete Pack — ${params.slug.replace(/-/g, " ")} | Career Updates` },
      { name: "description", content: "Get a complete dMAT module pack." },
      { property: "og:type", content: "product" },
      { name: "robots", content: "index, follow" },
      { property: "og:url", content: `${SITE_URL}/dmat-resources/packs/${params.slug}` },
    ],
  }),
  component: DmatPackDetail,
});

function DmatPackDetail() {
  const { slug } = Route.useParams();
  const getBundle = useServerFn(getDmatBundleBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dmat-pack-detail", slug],
    queryFn: () => getBundle({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-2/3 rounded bg-muted/50" />
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="aspect-[3/2] rounded-2xl bg-muted/50" />
              <div className="space-y-4">
                <div className="h-6 w-1/2 rounded bg-muted/50" />
                <div className="h-10 w-1/3 rounded bg-muted/50" />
                <div className="h-12 w-full rounded bg-muted/50" />
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h1 className="mt-4 text-xl font-bold">Pack not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This pack may have been removed or is not published.</p>
            <Link to="/dmat-resources/packs" className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
              View All Packs
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { product, resources, relatedBundles } = data;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <BundleDetailView
          product={product}
          resources={resources}
          relatedBundles={relatedBundles}
          parentBreadcrumbLabel="dMAT Complete"
          parentBreadcrumbHref="/dmat-resources/packs"
          aboutLabel="About This Pack"
          relatedLabel="Related Packs"
          bundleTypeLabel="Pack"
          relatedBundleBaseUrl="/dmat-resources/packs/$slug"
        />
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
