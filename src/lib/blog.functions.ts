import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const BlogInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().default("Career Updates"),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
});

export type BlogInputType = z.infer<typeof BlogInput>;

// ─── Public Functions ─────────────────────────────────────────────────────────

export const getPublishedBlogs = createServerFn({ method: "GET" })
  .validator(
    (input: { page?: number; limit?: number; search?: string; category?: string }) =>
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(9),
          search: z.string().optional(),
          category: z.string().optional(),
        })
        .parse(input)
  )
  .handler(async ({ data }) => {
    const { page, limit, search, category } = data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = supabase
      .from("blogs")
      .select("id, title, slug, excerpt, cover_image, category, tags, author, featured, published_at, created_at", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (search) q = q.ilike("title", `%${search}%`);
    if (category) q = q.eq("category", category);

    const { data: blogs, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);

    return { blogs: blogs ?? [], total: count ?? 0, page, limit };
  });

export const getFeaturedBlog = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("blogs")
    .select("id, title, slug, excerpt, cover_image, category, tags, author, published_at")
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
});

export const getBlogBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => z.string().parse(slug))
  .handler(async ({ data: slug }) => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) throw new Error("Blog post not found");
    return data;
  });

export const getBlogCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("blogs")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);

  if (error) throw new Error(error.message);

  const categories = [...new Set((data ?? []).map((b) => b.category).filter(Boolean))] as string[];
  return categories;
});

export const getRelatedBlogs = createServerFn({ method: "GET" })
  .validator(
    (input: { slug: string; category?: string; limit?: number }) =>
      z.object({ slug: z.string(), category: z.string().optional(), limit: z.number().default(3) }).parse(input)
  )
  .handler(async ({ data }) => {
    const { slug, category, limit } = data;

    let q = supabase
      .from("blogs")
      .select("id, title, slug, excerpt, cover_image, category, published_at")
      .eq("status", "published")
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (category) q = q.eq("category", category);

    const { data: blogs, error } = await q;
    if (error) throw new Error(error.message);
    return blogs ?? [];
  });

// ─── Admin Functions ──────────────────────────────────────────────────────────

export const listAllBlogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("blogs")
      .select("id, title, slug, category, status, featured, published_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getBlogForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id, context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Blog not found");
    return data;
  });

export const upsertBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: BlogInputType) => BlogInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const now = new Date().toISOString();
    const payload: any = { ...data };

    // Set published_at when publishing for the first time
    if (data.status === "published" && !data.published_at) {
      payload.published_at = now;
    }

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("blogs")
        .update(payload)
        .eq("id", data.id)
        .select("id, slug")
        .single();

      if (error) throw new Error(error.message);
      return { action: "updated", blog: updated };
    }

    const { data: inserted, error } = await context.supabase
      .from("blogs")
      .insert(payload)
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);
    return { action: "created", blog: inserted };
  });

export const deleteBlog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("blogs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleBlogFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; featured: boolean }) =>
    z.object({ id: z.string().uuid(), featured: z.boolean() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("blogs")
      .update({ featured: data.featured })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateBlogStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: "draft" | "published" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const payload: any = { status: data.status };
    if (data.status === "published") {
      // Only set published_at if not already set
      const { data: current } = await context.supabase
        .from("blogs")
        .select("published_at")
        .eq("id", data.id)
        .single();
      if (!current?.published_at) {
        payload.published_at = new Date().toISOString();
      }
    }

    const { error } = await context.supabase.from("blogs").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
