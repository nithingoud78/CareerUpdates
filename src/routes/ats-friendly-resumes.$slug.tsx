import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Download,
  ChevronRight,
  Tag,
  Users,
  Layers,
  Package,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { TemplateCard } from "@/components/career-tools/template-card";
import { PriceDisplay } from "@/components/career-tools/price-display";
import { AdSlot } from "@/components/ads/ad-slot";
import { ShareButton } from "@/components/career-tools/share-button";
import { TemplateDetailView } from "@/components/career-tools/template-detail-view";
import { getTemplateBySlug, getPublicDownloadUrl } from "@/lib/career-tools.functions";

const SITE_URL = "https://careerupdates.co.in";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume Template",
  cover_letter: "Cover Letter Template",
  referral_message: "Referral Message Template",
  cold_email: "Cold Email Template",
};

export const Route = createFileRoute("/ats-friendly-resumes/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `ATS Friendly Resumes — ${params.slug.replace(/-/g, " ")} | Career Updates` },
      { name: "description", content: `Download this professional ATS-friendly resume. Easy to edit.` },
      { property: "og:type", content: "product" },
      { name: "robots", content: "index, follow" },
      { property: "og:url", content: `${SITE_URL}/ats-friendly-resumes/${params.slug}` },
    ],
  }),
  component: TemplateDetail,
});

function TemplateDetail() {
  const { slug } = Route.useParams();
  const getTemplate = useServerFn(getTemplateBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["template-detail", slug],
    queryFn: () => getTemplate({ data: { slug } }),
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
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h1 className="mt-4 text-xl font-bold">Resume not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This resume may have been removed or is not yet published.</p>
            <Link to="/ats-friendly-resumes" className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
              View All Resumes
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { product, related, relatedBundles } = data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <TemplateDetailView
          product={product}
          related={related}
          relatedBundles={relatedBundles}
        />
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
