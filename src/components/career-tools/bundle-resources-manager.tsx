import { useState, useRef } from "react";
import { X, Plus, GripVertical, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { upsertCareerProduct } from "@/lib/career-tools.functions";
import { defaultProductFormData } from "./admin-product-form";
import { compressImage } from "@/lib/image-compressor";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  referral_message: "Referral Message",
  cold_email: "Cold Email",
};

function FileUploadButton({
  label,
  folder,
  accept,
  onUpload,
}: {
  label: string;
  folder: string;
  accept: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const isImage = file.type.startsWith("image/");
      const processedFile = isImage ? await compressImage(file) : file;
      const ext = processedFile.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("career-tools").upload(path, processedFile, { upsert: true });
      if (error) throw new Error(error.message);
      onUpload(path);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={ref} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        {uploading ? "Uploading…" : label}
      </button>
    </div>
  );
}

export function BundleResourcesManager({
  resources,
  onChange,
  allProducts,
  onResourceCreated,
}: {
  resources: { resource_product_id: string; sort_order: number }[];
  onChange: (r: { resource_product_id: string; sort_order: number }[]) => void;
  allProducts: any[];
  onResourceCreated: () => void;
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("resume");
  const [newFileUrl, setNewFileUrl] = useState<string | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveProduct = useServerFn(upsertCareerProduct);

  const selectedIds = new Set(resources.map((r) => r.resource_product_id));
  const available = allProducts.filter((p: any) => !selectedIds.has(p.id));

  function addExisting(product: any) {
    onChange([...resources, { resource_product_id: product.id, sort_order: resources.length }]);
  }

  function removeResource(id: string) {
    onChange(resources.filter((r) => r.resource_product_id !== id).map((r, i) => ({ ...r, sort_order: i })));
  }

  function moveResource(index: number, direction: -1 | 1) {
    if (index + direction < 0 || index + direction >= resources.length) return;
    const updated = [...resources];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    onChange(updated.map((r, i) => ({ ...r, sort_order: i })));
  }

  async function handleCreateNew() {
    if (!newTitle) return alert("Title is required");
    setIsSaving(true);
    try {
      const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
      const product = await saveProduct({
        data: {
          ...defaultProductFormData,
          title: newTitle,
          slug,
          resource_type: newType as any,
          file_url: newFileUrl,
          preview_image_url: newPreviewUrl,
          description: newDesc,
          product_type: "single_template",
          status: "published",
        },
      });
      onChange([...resources, { resource_product_id: product.id, sort_order: resources.length }]);
      onResourceCreated();
      setIsAddingNew(false);
      setNewTitle("");
      setNewFileUrl(null);
      setNewPreviewUrl(null);
      setNewDesc("");
    } catch (err: any) {
      alert(err.message || "Failed to create resource");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Bundle Contents</h2>
          <p className="text-xs text-muted-foreground">Add individual templates and resources to this bundle.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add New File
        </button>
      </div>

      {resources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Included ({resources.length})</p>
          <ul className="space-y-1.5">
            {resources.map((r, index) => {
              const p = allProducts.find((x: any) => x.id === r.resource_product_id);
              return (
                <li key={r.resource_product_id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => moveResource(index, -1)} className="text-muted-foreground hover:text-foreground">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveResource(index, 1)} className="text-muted-foreground hover:text-foreground">
                      ↓
                    </button>
                  </div>
                  {p?.preview_image_url ? (
                    <img
                      src={p.preview_image_url?.startsWith("http") ? p.preview_image_url : supabase.storage.from("career-tools").getPublicUrl(p.preview_image_url).data.publicUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p?.title ?? r.resource_product_id}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p?.category || RESOURCE_TYPE_LABELS[p?.resource_type ?? ""] || p?.resource_type}
                      {p?.file_url && " · File uploaded"}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeResource(r.resource_product_id)} className="rounded-full p-1 hover:bg-accent hover:text-red-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isAddingNew && (
        <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Create New Resource</h3>
            <button type="button" onClick={() => setIsAddingNew(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Title *</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full mt-1 rounded-md border bg-background px-3 py-1.5 text-sm" placeholder="e.g. Minimal Resume" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Resource Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full mt-1 rounded-md border bg-background px-3 py-1.5 text-sm">
                <option value="resume">Resume</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="referral_message">Referral Message</option>
                <option value="cold_email">Cold Email</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Description (optional)</label>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full mt-1 rounded-md border bg-background px-3 py-1.5 text-sm" />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <FileUploadButton label={newFileUrl ? "Change File" : "Upload File"} folder="resume-templates" accept=".docx,.pdf,.txt,application/pdf" onUpload={setNewFileUrl} />
            <FileUploadButton label={newPreviewUrl ? "Change Preview Image" : "Upload Preview Image"} folder="previews" accept="image/*" onUpload={setNewPreviewUrl} />
          </div>
          
          {(newFileUrl || newPreviewUrl) && (
            <div className="text-[11px] text-muted-foreground flex gap-4">
              {newFileUrl && <span>File: {newFileUrl.split("/").pop()}</span>}
              {newPreviewUrl && <span>Preview: {newPreviewUrl.split("/").pop()}</span>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAddingNew(false)} className="rounded-full px-3 py-1.5 text-xs hover:bg-muted">Cancel</button>
            <button type="button" onClick={handleCreateNew} disabled={isSaving || !newTitle} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Save & Add
            </button>
          </div>
        </div>
      )}

      {!isAddingNew && available.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Or pick existing resource</p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {available.map((p: any) => (
              <button key={p.id} type="button" onClick={() => addExisting(p)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/30">
                <Plus className="h-3.5 w-3.5 shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {RESOURCE_TYPE_LABELS[p.resource_type] ?? p.resource_type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
