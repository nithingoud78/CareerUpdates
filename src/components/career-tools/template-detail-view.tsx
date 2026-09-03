import { Link } from "@tanstack/react-router";
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
import { TemplateCard } from "@/components/career-tools/template-card";
import { PriceDisplay } from "@/components/career-tools/price-display";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { ShareButton } from "@/components/career-tools/share-button";
import { PreviewImage } from "@/components/career-tools/preview-image";
import { ScrollReveal } from "@/components/scroll-reveal";

const SITE_URL = "https://careerupdates.co.in";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume Template",
  cover_letter: "Cover Letter Template",
  referral_message: "Referral Message Template",
  cold_email: "Cold Email Template",
};

const CTA_LABELS: Record<string, string> = {
  resume: "Resume",
  cover_letter: "Cover",
  referral_message: "Referral",
  cold_email: "Cold Email",
};

export function TemplateDetailView({
  product,
  related,
  relatedBundles,
  onDownload,
  downloadPending,
  downloadSuccess,
  downloadError,
  adminActions,
}: {
  product: any;
  related?: any[];
  relatedBundles?: any[];
  onDownload?: () => void;
  downloadPending?: boolean;
  downloadSuccess?: boolean;
  downloadError?: string | null;
  adminActions?: React.ReactNode;
}) {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "ATS Friendly Resumes", href: "/ats-friendly-resumes/" },
    { name: product.title, href: `/ats-friendly-resumes/${product.slug}` },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description ?? product.description ?? "",
    url: `${SITE_URL}/ats-friendly-resumes/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.current_price.toFixed(2),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/ats-friendly-resumes/${product.slug}`,
    },
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {breadcrumbs.map((b, i) => (
          <span key={b.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {i < breadcrumbs.length - 1 ? (
              <Link to={b.href as any} className="hover:text-foreground">{b.name}</Link>
            ) : (
              <span className="text-foreground font-medium">{b.name}</span>
            )}
          </span>
        ))}
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: `${SITE_URL}${b.href}` })),
      }) }} />

      {/* Main grid */}
      <ScrollReveal>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Preview */}
        <div className="order-2 lg:order-1">
          <div className="glass overflow-hidden rounded-2xl">
            {product.preview_image_url ? (
              <div className="relative w-full">
                <PreviewImage
                  src={resolvePreviewImageUrl(product.preview_image_url) || ""}
                  alt={product.title}
                  className="w-full h-auto object-contain"
                  fallback={
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/20">
                      <FileText className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No preview image</p>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-3 bg-muted/20">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No preview image</p>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="order-1 space-y-5 lg:order-2">
          {product.category || product.resource_type ? (
            <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {product.category || RESOURCE_TYPE_LABELS[product.resource_type] || "Template"}
            </span>
          ) : null}

          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{product.title}</h1>

          {product.short_description && (
            <p className="text-sm text-muted-foreground">{product.short_description}</p>
          )}

          {/* Pricing */}
          <PriceDisplay original={product.original_price} current={product.is_free ? 0 : product.current_price} size="lg" />

          {/* Download / CTA */}
          <div className="space-y-2">
            {product.file_url || product.product_type === 'bundle' ? (
              <Link
                to={product.product_type === 'bundle' ? "/checkout/bundle/$slug" : "/checkout/$slug"}
                params={{ slug: product.slug }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
              >
                <Download className="h-4 w-4" />
                Get {product.product_type === 'bundle' ? 'Pack' : (product.resource_type ? CTA_LABELS[product.resource_type] || 'Template' : 'Template')} — {product.is_free ? 'Free' : `₹${product.current_price}`}
              </Link>
            ) : (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm font-medium">Currently Unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">This item is not available for purchase.</p>
              </div>
            )}
            <Link
              to="/ats-checker"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              <ShieldCheck className="h-4 w-4" /> Check My Resume Against a Job
            </Link>
            <ShareButton url={`${SITE_URL}/ats-friendly-resumes/${product.slug}`} />
          </div>

          {/* Quick facts */}
          <div className="divide-y divide-border rounded-xl border border-border">
            {product.ats_friendly && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                <span>ATS-friendly layout</span>
              </div>
            )}
            {product.file_format && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Format: <strong>{product.file_format}</strong></span>
              </div>
            )}
            {product.category && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm">
                <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Category: <strong>{product.category}</strong></span>
              </div>
            )}
          </div>

          {/* Attribution */}
          {product.attribution_required && product.attribution_text && (
            <p className="text-[11px] text-muted-foreground">Source: {product.attribution_text}</p>
          )}
        </div>
      </div>
      </ScrollReveal>

      {/* Full description */}
      {!adminActions && <AdSlot placement="homeMiddle" className="mt-12" />}

      {product.description && (
        <ScrollReveal>
          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-bold">About This Template</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              {product.description.split("\n").map((p: string, i: number) => p.trim() && <p key={i}>{p}</p>)}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Suitable for */}
      {product.suitable_for?.length > 0 && (
        <ScrollReveal>
          <section className="mt-8 space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-brand" /> Who Is This For?
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.suitable_for.map((s: string) => (
                <span key={s} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Features */}
      {product.features?.length > 0 && (
        <ScrollReveal>
          <section className="mt-8 space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Layers className="h-5 w-5 text-brand" /> Key Features
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {product.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        </ScrollReveal>
      )}

      {/* Related bundles */}
      {relatedBundles && relatedBundles.length > 0 && (
        <ScrollReveal delay={0.1}>
          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Package className="h-5 w-5 text-brand" /> Available in Bundles
              </h2>
              <Link to="/ats-resumes-pack" className="text-sm font-medium text-brand hover:underline">View all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedBundles.map((b: any) => (
                <Link
                  key={b.id}
                  to="/ats-resumes-pack/$slug"
                  params={{ slug: b.slug }}
                  className="glass flex items-center gap-4 rounded-2xl p-4 hover:shadow-sm hover:shadow-brand/10 transition-all"
                >
                  {b.preview_image_url ? (
                    <PreviewImage 
                      src={resolvePreviewImageUrl(b.preview_image_url) || ""} 
                      alt={b.title} 
                      className="h-12 w-12 rounded-lg object-cover" 
                      fallback={<Package className="h-10 w-10 shrink-0 text-brand/30" />}
                    />
                  ) : (
                    <Package className="h-10 w-10 shrink-0 text-brand/30" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.title}</p>
                    <PriceDisplay original={b.original_price} current={b.current_price} size="sm" />
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Related templates */}
      {related && related.length > 0 && (
        <ScrollReveal delay={0.1}>
          <section className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Related Templates</h2>
              <Link to="/ats-friendly-resumes" className="text-sm font-medium text-brand hover:underline">View all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t: any) => (
                <TemplateCard key={t.id} template={t as any} compact />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Admin Actions */}
      {adminActions && (
        <section className="mt-16 pt-8 border-t border-border">
          <h2 className="text-xl font-bold mb-6">Admin Controls</h2>
          {adminActions}
        </section>
      )}
    </>
  );
}
