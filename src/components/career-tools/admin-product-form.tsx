/**
 * AdminProductForm
 * Shared form component for creating and editing both:
 * - Single templates (resume, cover_letter, referral_message, cold_email)
 * - Bundle products (bundles also use BundleResourcesManager)
 */
import { useState, useRef } from "react";
import { Loader2, Plus, X, ArrowLeft, Save, Trash2, Link as LinkIcon, Image as ImageIcon, Upload } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { CareerProduct, CareerProductType, CareerResourceType } from "@/lib/career-tools.functions";
import { supabase } from "@/integrations/supabase/client";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { PreviewImage } from "./preview-image";
import { compressImage } from "@/lib/image-compressor";

export interface ProductFormData {
  id?: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  product_type: CareerProductType;
  resource_type: CareerResourceType;
  category: string;
  tags: string[];
  suitable_for: string[];
  features: string[];
  ats_friendly: boolean;
  file_format: string;
  file_url: string | null;
  download_file_name: string | null;
  preview_image_url: string | null;
  original_price: number;
  current_price: number;
  is_free: boolean;
  status: "draft" | "published" | "archived";
  pinned: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  og_image: string;
  source_url: string;
  license: string;
  license_url: string;
  attribution_required: boolean;
  attribution_text: string;
}

export const defaultProductFormData: ProductFormData = {
  slug: "",
  title: "",
  short_description: "",
  description: "",
  product_type: "single_template",
  resource_type: "resume",
  category: "",
  tags: [],
  suitable_for: [],
  features: [],
  ats_friendly: false,
  file_format: "DOCX",
  file_url: null,
  download_file_name: null,
  preview_image_url: null,
  original_price: 299,
  current_price: 29,
  is_free: false,
  status: "draft",
  pinned: false,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  og_image: "",
  source_url: "",
  license: "Original Creation — Career Updates",
  license_url: "",
  attribution_required: false,
  attribution_text: "",
};

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

interface AdminProductFormProps {
  initial?: Partial<ProductFormData>;
  productType: CareerProductType;
  isPending: boolean;
  error: string | null;
  onSubmit: (data: ProductFormData) => void;
  backHref: string;
  backLabel: string;
}

// ─── Tag/array editor ──────────────────────────────────────────────────────────
function ArrayField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function addItem() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {value.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="ml-0.5 rounded-full hover:text-red-500"
              aria-label={`Remove ${v}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder={placeholder}
            className="rounded-full border border-input bg-background px-3 py-0.5 text-xs"
          />
          <button
            type="button"
            onClick={addItem}
            className="flex items-center rounded-full border border-border px-2 py-0.5 text-xs hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── File upload field ─────────────────────────────────────────────────────────
function FileUploadField({
  label,
  currentUrl,
  folder,
  accept,
  onUpload,
  onRemove,
  description,
}: {
  label: string;
  currentUrl: string | null;
  folder: string;
  accept: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  description?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      // Compress if it's an image
      const processedFile = await compressImage(file);
      const ext = processedFile.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("career-tools")
        .upload(path, processedFile, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      onUpload(path);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          ref={ref}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
          id={`upload-${folder}`}
        />
        <label
          htmlFor={`upload-${folder}`}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Uploading…" : "Choose File"}
        </label>
        {currentUrl && (
          <div className="flex items-center gap-2">
            <span className="max-w-[12rem] truncate rounded-full bg-muted px-2.5 py-1 text-[11px]" title={currentUrl}>
              {currentUrl.split("/").pop()}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

function Field({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function AdminProductForm({
  initial,
  productType,
  isPending,
  error,
  onSubmit,
  backHref,
  backLabel,
}: AdminProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    ...defaultProductFormData,
    product_type: productType,
    ...initial,
  });

  const set = (patch: Partial<ProductFormData>) => setForm((f) => ({ ...f, ...patch }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Basic Information</h2>

        <Field label="Title *" id="p-title">
          <input
            id="p-title"
            required
            value={form.title}
            onChange={(e) => set({ title: e.target.value, slug: slugify(e.target.value) })}
            className={inputCls}
            placeholder="Clean Professional Resume"
          />
        </Field>

        <Field label="Slug *" id="p-slug">
          <input
            id="p-slug"
            required
            value={form.slug}
            onChange={(e) => set({ slug: e.target.value })}
            className={inputCls}
            placeholder="clean-professional-resume"
          />
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            URL: /resume-{productType === "bundle" ? "bundles" : "templates"}/{form.slug || "…"}
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Resource Type" id="p-resource-type">
            <select
              id="p-resource-type"
              value={form.resource_type}
              onChange={(e) => set({ resource_type: e.target.value as any })}
              className={inputCls}
            >
              <option value="resume">Resume</option>
              <option value="cover_letter">Cover Letter</option>
              <option value="referral_message">Referral Message</option>
              <option value="cold_email">Cold Email</option>
            </select>
          </Field>

          <Field label="Category" id="p-category">
            <input
              id="p-category"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              className={inputCls}
              placeholder="Professional, Fresher, Bundle…"
            />
          </Field>
        </div>

        <Field label="Short Description" id="p-short-desc">
          <input
            id="p-short-desc"
            value={form.short_description}
            onChange={(e) => set({ short_description: e.target.value })}
            className={inputCls}
            placeholder="One-line description shown on cards"
          />
        </Field>

        <Field label="Full Description" id="p-desc">
          <textarea
            id="p-desc"
            rows={5}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            className={`${inputCls} resize-y`}
            placeholder="Detailed description shown on the product page…"
          />
        </Field>
      </section>

      {/* Pricing & status */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Pricing & Status</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Original Price (₹)" id="p-original-price">
            <input
              id="p-original-price"
              type="number"
              min={0}
              step={1}
              value={form.original_price}
              onChange={(e) => set({ original_price: Number(e.target.value) })}
              className={inputCls}
              disabled={form.is_free}
            />
          </Field>
          <Field label="Current Price (₹)" id="p-current-price">
            <input
              id="p-current-price"
              type="number"
              min={0}
              step={1}
              value={form.current_price}
              onChange={(e) => set({ current_price: Number(e.target.value) })}
              className={inputCls}
              disabled={form.is_free}
            />
          </Field>
          <Field label="Sort Order" id="p-sort-order">
            <input
              id="p-sort-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => set({ sort_order: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer mt-2 mb-4">
          <input
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => set({ is_free: e.target.checked })}
            className="rounded border-input text-brand focus:ring-brand"
          />
          <span className="text-sm font-medium">Make {productType === 'bundle' ? 'Resume Pack' : 'Template'} Free</span>
        </label>

        <div className="flex flex-wrap gap-6">
          <Field label="Status" id="p-status">
            <select
              id="p-status"
              value={form.status}
              onChange={(e) => set({ status: e.target.value as any })}
              className={`${inputCls} w-auto`}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => set({ pinned: e.target.checked })}
              className="h-4 w-4 rounded accent-brand"
            />
            Pinned (show first)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ats_friendly}
              onChange={(e) => set({ ats_friendly: e.target.checked })}
              className="h-4 w-4 rounded accent-brand"
            />
            ATS Friendly
          </label>
        </div>
        <Field label="File Format" id="p-file-format">
          <input
            id="p-file-format"
            value={form.file_format}
            onChange={(e) => set({ file_format: e.target.value })}
            className={`${inputCls} w-48`}
            placeholder="DOCX"
          />
        </Field>
      </section>

      {/* Files */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">{productType === "single_template" ? "A. Preview Image" : "Preview Image"}</h2>
        <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-4">
          <FileUploadField
            label="Preview Image"
            currentUrl={form.preview_image_url}
            folder="previews"
            accept="image/jpeg,image/png,image/webp"
            onUpload={(url) => set({ preview_image_url: url })}
            onRemove={() => set({ preview_image_url: null })}
            description="JPEG/PNG/WebP — shown on listing and detail pages"
          />
          {form.preview_image_url && (
            <div>
              <PreviewImage
                src={resolvePreviewImageUrl(form.preview_image_url) || ""}
                alt="Preview"
                className="h-24 w-auto rounded border border-border object-cover"
                fallback={<div className="flex h-24 w-24 items-center justify-center rounded border border-border bg-muted"><ImageIcon className="h-6 w-6 text-muted-foreground/30" /></div>}
              />
            </div>
          )}
        </div>

        {productType === "single_template" && (
          <>
            <h2 className="font-semibold text-lg pt-4">B. Primary Downloadable File</h2>
            <div className="rounded-xl border border-border p-4 bg-brand/5 space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                This is the actual resource that the user will download.
              </p>
              <FileUploadField
                label="Downloadable File"
                currentUrl={form.file_url}
                folder="resume-templates"
                accept=".docx,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onUpload={(url) => set({ file_url: url })}
                onRemove={() => set({ file_url: null })}
                description="DOCX or PDF — used for the download link on the product page"
              />
              <Field label="Custom Download Filename (Optional)" id="p-download-file-name">
                <input
                  id="p-download-file-name"
                  value={form.download_file_name || ""}
                  onChange={(e) => set({ download_file_name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Minimalist_Resume_Template"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The downloaded file will be renamed to this (the original extension is automatically preserved).
                </p>
              </Field>
            </div>
          </>
        )}
      </section>

      {/* Product details */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Details & Tags</h2>
        <ArrayField label="Tags" value={form.tags} onChange={(v) => set({ tags: v })} placeholder="Add tag…" />
        <ArrayField label="Suitable For" value={form.suitable_for} onChange={(v) => set({ suitable_for: v })} placeholder="Freshers, Experienced…" />
        <ArrayField label="Features" value={form.features} onChange={(v) => set({ features: v })} placeholder="ATS-friendly layout…" />
      </section>

      {/* SEO */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">SEO</h2>
        <Field label="SEO Title" id="p-seo-title">
          <input
            id="p-seo-title"
            value={form.seo_title}
            onChange={(e) => set({ seo_title: e.target.value })}
            className={inputCls}
            placeholder="SEO-optimised page title"
          />
        </Field>
        <Field label="SEO Description" id="p-seo-desc">
          <textarea
            id="p-seo-desc"
            rows={3}
            value={form.seo_description}
            onChange={(e) => set({ seo_description: e.target.value })}
            className={`${inputCls} resize-y`}
            placeholder="SEO meta description (150–160 chars)"
          />
        </Field>
      </section>

      {/* Attribution */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">License & Attribution</h2>
        <Field label="License" id="p-license">
          <input
            id="p-license"
            value={form.license}
            onChange={(e) => set({ license: e.target.value })}
            className={inputCls}
            placeholder="Original Creation — Career Updates"
          />
        </Field>
        <Field label="Source URL" id="p-source-url">
          <input
            id="p-source-url"
            value={form.source_url}
            onChange={(e) => set({ source_url: e.target.value })}
            className={inputCls}
            placeholder="https://…"
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.attribution_required}
            onChange={(e) => set({ attribution_required: e.target.checked })}
            className="h-4 w-4 rounded accent-brand"
          />
          Attribution required
        </label>
        {form.attribution_required && (
          <Field label="Attribution Text" id="p-attribution-text">
            <input
              id="p-attribution-text"
              value={form.attribution_text}
              onChange={(e) => set({ attribution_text: e.target.value })}
              className={inputCls}
            />
          </Field>
        )}
      </section>

      {/* Actions */}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <Link
          to={backHref as any}
          className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          {backLabel}
        </Link>
      </div>
    </form>
  );
}
