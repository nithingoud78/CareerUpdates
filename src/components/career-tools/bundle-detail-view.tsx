import { Link } from "@tanstack/react-router";
import {
  Download,
  AlertCircle,
  Package,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BundleCard } from "@/components/career-tools/bundle-card";
import { PriceDisplay } from "@/components/career-tools/price-display";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { ShareButton } from "@/components/career-tools/share-button";
import { PreviewImage } from "@/components/career-tools/preview-image";

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

export function BundleDetailView({
  product,
  resources,
  relatedBundles,
  onDownload,
  downloadPending,
  downloadSuccess,
  downloadError,
  adminActions,
}: {
  product: any;
  resources: any[];
  relatedBundles?: any[];
  onDownload?: () => void;
  downloadPending?: boolean;
  downloadSuccess?: boolean;
  downloadError?: string | null;
  adminActions?: React.ReactNode;
}) {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "ATS Resumes Pack", href: "/ats-resumes-pack/" },
    { name: product.title, href: `/ats-resumes-pack/${product.slug}` },
  ];

  // Group resources by type for module display
  const grouped = resources.reduce((acc: Record<string, any[]>, r) => {
    const type = r.resource?.resource_type ?? "resume";
    if (!acc[type]) acc[type] = [];
    acc[type].push(r);
    return acc;
  }, {});

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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.short_description ?? "",
        url: `${SITE_URL}/ats-resumes-pack/${product.slug}`,
        offers: { "@type": "Offer", price: product.current_price.toFixed(2), priceCurrency: "INR", availability: "https://schema.org/InStock" },
      }) }} />

      {/* Hero grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
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
                    <div className="flex absolute inset-0 h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand/10 to-brand/5">
                      <Package className="h-10 w-10 text-brand/30" />
                      <p className="text-sm text-muted-foreground">Bundle Preview</p>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] w-full md:aspect-[3/4] flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand/10 to-brand/5">
                <Package className="h-10 w-10 text-brand/30" />
                <p className="text-sm text-muted-foreground">Bundle Preview</p>
              </div>
            )}
          </div>

          {/* Resources overview */}
          {resources.length > 0 && (
            <div className="mt-6 glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold">What's in This Bundle</h3>
              <ul className="space-y-2">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 text-sm">
                    <span className="text-base">{RESOURCE_TYPE_ICONS[r.resource?.resource_type ?? "resume"] ?? "📄"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.resource?.title ?? "Resource"}</p>
                      <p className="text-[11px] text-muted-foreground">{r.resource?.category || RESOURCE_TYPE_LABELS[r.resource?.resource_type ?? "resume"]}</p>
                    </div>
                    {r.resource?.ats_friendly && (
                      <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        ATS ✓
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground pt-1">
                {resources.length} item{resources.length !== 1 ? "s" : ""} included
              </p>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="order-1 space-y-5 lg:order-2">
          <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            Bundle · {resources.length} items
          </span>

          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">{product.title}</h1>

          {product.short_description && (
            <p className="text-sm text-muted-foreground">{product.short_description}</p>
          )}

          <PriceDisplay original={product.original_price} current={product.is_free ? 0 : product.current_price} size="lg" />

          {/* CTA */}
          <div className="space-y-2">
            {product.file_url || resources.length > 0 ? (
              <Link
                to="/checkout/bundle/$slug"
                params={{ slug: product.slug }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
              >
                <Download className="h-4 w-4" />
                Get Pack — {product.is_free ? 'Free' : `₹${product.current_price}`}
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
            <ShareButton url={`${SITE_URL}/ats-resumes-pack/${product.slug}`} />
          </div>

          {/* Suitable for */}
          {product.suitable_for?.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-brand" /> Best for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {product.suitable_for.map((s: string) => (
                  <span key={s} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!adminActions && <AdSlot placement="homeMiddle" className="mt-12" />}

      {/* Full description */}
      {product.description && (
        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">About This Bundle</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            {product.description.split("\n").map((p: string, i: number) => p.trim() && <p key={i}>{p}</p>)}
          </div>
        </section>
      )}

      {/* Modules */}
      {Object.keys(grouped).length > 0 && (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-bold">What You'll Get</h2>
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, items], moduleIdx) => (
              <div key={type} className="glass rounded-2xl p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {moduleIdx + 1}
                  </span>
                  <h3 className="font-semibold">
                    {RESOURCE_TYPE_LABELS[type] ?? type}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {items.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium">{r.resource?.title}</p>
                        {r.resource?.short_description && (
                          <p className="text-xs text-muted-foreground">{r.resource.short_description}</p>
                        )}
                        {r.resource?.features?.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {r.resource.features.slice(0, 3).map((f: string) => (
                              <li key={f} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bundle features */}
      {product.features?.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-bold">Bundle Features</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {product.features.map((f: string) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related bundles */}
      {relatedBundles && relatedBundles.length > 0 && (
        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">More Bundles</h2>
            <Link to="/ats-resumes-pack" className="text-sm font-medium text-brand hover:underline">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedBundles.map((b: any) => (
              <BundleCard key={b.id} bundle={b as any} />
            ))}
          </div>
        </section>
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
