import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { upsertBlog } from "@/lib/blog.functions";
import type { BlogInputType } from "@/lib/blog.functions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

interface BlogEditorProps {
  initialData?: Partial<BlogInputType> & { id?: string };
}

export function BlogEditor({ initialData }: BlogEditorProps) {
  const navigate = useNavigate();
  const upsert = useServerFn(upsertBlog);
  const qc = useQueryClient();

  const [slugLocked, setSlugLocked] = useState(!!initialData?.id);
  const [form, setForm] = useState<BlogInputType & { id?: string }>({
    id: initialData?.id,
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    cover_image: initialData?.cover_image ?? "",
    category: initialData?.category ?? "",
    tags: initialData?.tags ?? [],
    author: initialData?.author ?? "Career Updates",
    status: initialData?.status ?? "draft",
    featured: initialData?.featured ?? false,
    seo_title: initialData?.seo_title ?? "",
    seo_description: initialData?.seo_description ?? "",
    published_at: initialData?.published_at ?? null,
  });
  const [tagsInput, setTagsInput] = useState((initialData?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    set("title", value);
    if (!slugLocked) {
      set("slug", slugify(value));
    }
  }

  const mutation = useMutation({
    mutationFn: (status: "draft" | "published") =>
      upsert({
        data: {
          ...form,
          status,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          excerpt: form.excerpt || null,
          content: form.content || null,
          cover_image: form.cover_image || null,
          category: form.category || null,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
        },
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      setSavedStatus(result.action === "created" ? "Created!" : "Saved!");
      setTimeout(() => setSavedStatus(null), 2500);
      if (result.action === "created" && result.blog?.id) {
        navigate({ to: "/admin/blog/$id/edit", params: { id: result.blog.id } });
      }
    },
    onError: (err: any) => {
      setError(err.message ?? "Save failed");
    },
  });

  const inputClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold">✕</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter blog post title"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Slug <span className="text-destructive">*</span></label>
              <button
                type="button"
                onClick={() => setSlugLocked((v) => !v)}
                className="text-xs text-brand hover:underline"
              >
                {slugLocked ? "Unlock" : "Lock"}
              </button>
            </div>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugLocked(true);
                set("slug", e.target.value);
              }}
              placeholder="url-slug"
              readOnly={!slugLocked && !form.id}
            />
            <p className="text-xs text-muted-foreground">Public URL: /blog/{form.slug || "..."}</p>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Excerpt</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.excerpt ?? ""}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A short summary shown in blog listings..."
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Content (Markdown)</label>
            <textarea
              className={`${inputClass} min-h-[400px] resize-y font-mono text-xs`}
              value={form.content ?? ""}
              onChange={(e) => set("content", e.target.value)}
              placeholder="# Heading&#10;&#10;Write your post in Markdown..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish actions */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4">
            <p className="mb-3 text-sm font-semibold">Publish</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => mutation.mutate("published")}
                disabled={mutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
              >
                {savedStatus ?? (mutation.isPending ? "Saving…" : "Publish")}
              </button>
              <button
                onClick={() => mutation.mutate("draft")}
                disabled={mutation.isPending}
                className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Save as Draft
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Status: <span className="font-medium capitalize">{form.status}</span>
            </p>
          </div>

          {/* Featured */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <div>
                <p className="text-sm font-medium">Featured</p>
                <p className="text-xs text-muted-foreground">Shown prominently on the blog homepage</p>
              </div>
            </label>
          </div>

          {/* Cover image */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4 space-y-3">
            <p className="text-sm font-semibold">Cover Image</p>
            <input
              className={inputClass}
              value={form.cover_image ?? ""}
              onChange={(e) => set("cover_image", e.target.value)}
              placeholder="https://..."
            />
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover preview" className="h-32 w-full rounded-md object-cover" />
            )}
          </div>

          {/* Category & Tags */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4 space-y-3">
            <p className="text-sm font-semibold">Category & Tags</p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <input
                className={inputClass}
                value={form.category ?? ""}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Career Tips"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tags (comma-separated)</label>
              <input
                className={inputClass}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Interview, Resume, Tech"
              />
            </div>
          </div>

          {/* Author */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4 space-y-3">
            <p className="text-sm font-semibold">Author</p>
            <input
              className={inputClass}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Author name"
            />
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-border/50 bg-surface/50 p-4 space-y-3">
            <p className="text-sm font-semibold">SEO</p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">SEO Title</label>
              <input
                className={inputClass}
                value={form.seo_title ?? ""}
                onChange={(e) => set("seo_title", e.target.value)}
                placeholder="Leave blank to use post title"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">SEO Description</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.seo_description ?? ""}
                onChange={(e) => set("seo_description", e.target.value)}
                placeholder="Leave blank to use excerpt"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
