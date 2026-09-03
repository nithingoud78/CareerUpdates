import { Link } from "@tanstack/react-router";
import { Package, Star, FileText, CheckCircle2 } from "lucide-react";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { PriceDisplay } from "./price-display";
import { PreviewImage } from "./preview-image";

interface BundleCardProps {
  bundle: {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    category: string | null;
    preview_image_url: string | null;
    original_price: number;
    current_price: number;
    is_free?: boolean;
    pinned: boolean;
    suitable_for?: string[];
    tags?: string[];
  };
  resourceCount?: number;
}

export function BundleCard({ bundle, resourceCount }: BundleCardProps) {
  return (
    <Link
      to="/ats-resumes-pack/$slug"
      params={{ slug: bundle.slug }}
      className="group glass flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-brand/10 hover:-translate-y-0.5"
    >
      {/* Preview */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-gradient-to-br from-brand/10 to-brand/5">
        <PreviewImage
          src={resolvePreviewImageUrl(bundle.preview_image_url) || ""}
          alt={`${bundle.title} preview`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <Package className="h-10 w-10 text-brand/40" />
              <p className="text-xs text-muted-foreground">Bundle</p>
            </div>
          }
        />
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {bundle.pinned && (
            <span className="flex items-center gap-0.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
              <Star className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {resourceCount !== undefined && (
            <span className="flex items-center gap-0.5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
              <FileText className="h-2.5 w-2.5" /> {resourceCount} items
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {bundle.category && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">
            {bundle.category}
          </span>
        )}
        <h3 className="font-semibold leading-snug text-foreground group-hover:text-brand transition-colors">
          {bundle.title}
        </h3>
        {bundle.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{bundle.short_description}</p>
        )}
        {bundle.suitable_for && bundle.suitable_for.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bundle.suitable_for.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2">
          <PriceDisplay original={bundle.original_price} current={bundle.is_free ? 0 : bundle.current_price} size="sm" />
        </div>
      </div>
    </Link>
  );
}
