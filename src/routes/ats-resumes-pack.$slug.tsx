import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Download,
  AlertCircle,
  Package,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { BundleCard } from "@/components/career-tools/bundle-card";
import { PriceDisplay } from "@/components/career-tools/price-display";
import { AdSlot } from "@/components/ads/ad-slot";
import { ShareButton } from "@/components/career-tools/share-button";
import { BundleDetailView } from "@/components/career-tools/bundle-detail-view";
import { getBundleBySlug, getPublicDownloadUrl } from "@/lib/career-tools.functions";

const SITE_URL = "https://careerupdates.co.in";

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  resume: "📄",
  cover_letter: "✉️",
  referral_message: "🤝",
  cold_email: "📬",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume Template",
  cover_letter: "Cover Letter Template",
  referral_message: "Referral Message Templates",
  cold_email: "Cold Email Templates",
};

export const Route = createFileRoute("/ats-resumes-pack/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `ATS Resumes Pack — ${params.slug.replace(/-/g, " ")} | Career Updates` },
      { name: "description", content: "Get a complete job application pack with resume, cover letter, and outreach templates." },
      { property: "og:type", content: "product" },
      { name: "robots", content: "index, follow" },
      { property: "og:url", content: `${SITE_URL}/ats-resumes-pack/${params.slug}` },
    ],
  }),
  component: BundleDetail,
});

function BundleDetail() {
  const { slug } = Route.useParams();
  const getBundle = useServerFn(getBundleBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["bundle-detail", slug],
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
            <Link to="/ats-resumes-pack" className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
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
        />
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
