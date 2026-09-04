import { Link } from "@tanstack/react-router";
import { FileText, Star, CheckCircle2 } from "lucide-react";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { PriceDisplay } from "./price-display";
import { PreviewImage } from "./preview-image";

interface TemplateCardProps {
  template: {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    category: string | null;
    preview_image_url: string | null;
    original_price: number;
    current_price: number;
    is_free?: boolean;
    ats_friendly: boolean;
    pinned: boolean;
    file_format: string | null;
    suitable_for?: string[];
  };
  compact?: boolean;
  baseUrl?: "/ats-friendly-resumes/$slug" | "/dmat-resources/modules/$slug" | string;
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume Template",
  cover_letter: "Cover Letter",
  referral_message: "Referral Message",
  cold_email: "Cold Email",
  single_module: "Single Module",
  all_modules: "All Modules",
};

export function TemplateCard({ template, compact, baseUrl = "/ats-friendly-resumes/$slug" }: TemplateCardProps) {
  return (
    <Link
      to={baseUrl as any}
      params={{ slug: template.slug } as any}
      className="group glass flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md hover:shadow-brand/10 hover:-translate-y-0.5"
    >
      {/* Preview image */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted/30">
        <PreviewImage
          src={resolvePreviewImageUrl(template.preview_image_url) || ""}
          alt={`${template.title} preview`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
            </div>
          }
        />
        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {template.pinned && (
            <span className="flex items-center gap-0.5 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
              <Star className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {template.ats_friendly && (
            <span className="flex items-center gap-0.5 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              <CheckCircle2 className="h-2.5 w-2.5" /> ATS Friendly
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {template.category && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">
            {template.category}
          </span>
        )}
        <h3 className="font-semibold leading-snug text-foreground group-hover:text-brand transition-colors">
          {template.title}
        </h3>
        {!compact && template.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{template.short_description}</p>
        )}
        {template.file_format && (
          <p className="text-[10px] text-muted-foreground">Format: {template.file_format}</p>
        )}
        <div className="mt-auto pt-2">
          <PriceDisplay original={template.original_price} current={template.is_free ? 0 : template.current_price} size="sm" />
        </div>
      </div>
    </Link>
  );
}
