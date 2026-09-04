import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import JSZip from "jszip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export type CareerProductType = "single_template" | "bundle";
export type CareerResourceType = "resume" | "cover_letter" | "referral_message" | "cold_email" | "single_module" | "all_modules";
export type CareerProductStatus = "draft" | "published" | "archived";

export interface CareerProduct {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  product_type: CareerProductType;
  resource_type: CareerResourceType;
  category: string | null;
  tags: string[];
  suitable_for: string[];
  features: string[];
  ats_friendly: boolean;
  file_format: string | null;
  file_url: string | null;
  download_file_name: string | null;
  preview_image_url: string | null;
  original_price: number;
  current_price: number;
  status: CareerProductStatus;
  pinned: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  source_url: string | null;
  license: string | null;
  license_url: string | null;
  attribution_required: boolean;
  attribution_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface BundleResource {
  id: string;
  bundle_product_id: string;
  resource_product_id: string;
  sort_order: number;
  resource?: CareerProduct;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const CareerProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1, "Title required"),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  product_type: z.enum(["single_template", "bundle"]).default("single_template"),
  resource_type: z.enum(["resume", "cover_letter", "referral_message", "cold_email", "single_module", "all_modules"]).default("resume"),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  suitable_for: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  ats_friendly: z.boolean().default(false),
  file_format: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  download_file_name: z.string().nullable().optional(),
  preview_image_url: z.string().nullable().optional(),
  original_price: z.number().min(0).default(299),
  current_price: z.number().min(0).default(29),
  is_free: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  pinned: z.boolean().default(false),
  sort_order: z.number().default(0),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  og_image: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  license: z.string().nullable().optional(),
  license_url: z.string().nullable().optional(),
  attribution_required: z.boolean().default(false),
  attribution_text: z.string().nullable().optional(),
});

// ─── Public: list templates ───────────────────────────────────────────────────

export const getPublishedTemplates = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("career_tool_products")
    .select("id, slug, title, short_description, category, tags, suitable_for, ats_friendly, file_format, preview_image_url, original_price, current_price, is_free, pinned, sort_order, created_at")
    .eq("status", "published")
    .eq("product_type", "single_template")
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Public: list bundles ─────────────────────────────────────────────────────

export const getPublishedBundles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("career_tool_products")
    .select("id, slug, title, short_description, category, tags, suitable_for, preview_image_url, original_price, current_price, is_free, pinned, sort_order, created_at")
    .eq("status", "published")
    .eq("product_type", "bundle")
    .order("pinned", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Public: get template by slug ─────────────────────────────────────────────

export const getTemplateBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { data: product, error } = await supabase
      .from("career_tool_products")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .eq("product_type", "single_template")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;

    // Related templates
    const { data: related } = await supabase
      .from("career_tool_products")
      .select("id, slug, title, short_description, preview_image_url, original_price, current_price, is_free, category, ats_friendly")
      .eq("status", "published")
      .eq("product_type", "single_template")
      .neq("id", product.id)
      .limit(3);

    // Related bundles that contain this template
    const { data: bundleLinks } = await supabase
      .from("bundle_resources")
      .select("bundle_product_id")
      .eq("resource_product_id", product.id);

    const bundleIds = bundleLinks?.map((b) => b.bundle_product_id) ?? [];
    let relatedBundles: any[] = [];
    if (bundleIds.length > 0) {
      const { data: bundles } = await supabase
        .from("career_tool_products")
        .select("id, slug, title, short_description, preview_image_url, original_price, current_price, is_free")
        .eq("status", "published")
        .in("id", bundleIds)
        .limit(2);
      relatedBundles = bundles ?? [];
    }

    return { product, related: related ?? [], relatedBundles };
  });

// ─── Public: get bundle by slug ───────────────────────────────────────────────

export const getBundleBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { data: product, error } = await supabase
      .from("career_tool_products")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .eq("product_type", "bundle")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;

    // Bundle resources with full product data
    const { data: resources } = await supabase
      .from("bundle_resources")
      .select("id, sort_order, resource_product_id")
      .eq("bundle_product_id", product.id)
      .order("sort_order", { ascending: true });

    let resourceDetails: any[] = [];
    if (resources && resources.length > 0) {
      const resourceIds = resources.map((r) => r.resource_product_id);
      const { data: products } = await supabase
        .from("career_tool_products")
        .select("id, slug, title, short_description, resource_type, preview_image_url, features, file_format, ats_friendly")
        .in("id", resourceIds);
      if (products) {
        resourceDetails = resources.map((r) => ({
          ...r,
          resource: products.find((p) => p.id === r.resource_product_id),
        }));
      }
    }

    // Related bundles
    const { data: relatedBundles } = await supabase
      .from("career_tool_products")
      .select("id, slug, title, short_description, preview_image_url, original_price, current_price, is_free")
      .eq("status", "published")
      .eq("product_type", "bundle")
      .neq("id", product.id)
      .limit(2);

    return { product, resources: resourceDetails, relatedBundles: relatedBundles ?? [] };
  });

// ─── Admin: list all career products ─────────────────────────────────────────

export const listAllCareerProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("career_tool_products")
      .select("id, slug, title, short_description, product_type, resource_type, category, preview_image_url, original_price, current_price, is_free, status, pinned, sort_order, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Admin: get single product for editing ────────────────────────────────────

export const getCareerProductById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: product, error } = await context.supabase
      .from("career_tool_products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Product not found");

    // If bundle, fetch its resources
    let resources: any[] = [];
    if (product.product_type === "bundle") {
      const { data: bundleRes } = await context.supabase
        .from("bundle_resources")
        .select("id, resource_product_id, sort_order")
        .eq("bundle_product_id", product.id)
        .order("sort_order", { ascending: true });
      if (bundleRes && bundleRes.length > 0) {
        const ids = bundleRes.map((r: any) => r.resource_product_id);
        const { data: resProducts } = await context.supabase
          .from("career_tool_products")
          .select("id, slug, title, resource_type, preview_image_url")
          .in("id", ids);
        resources = bundleRes.map((r: any) => ({
          ...r,
          resource: resProducts?.find((p: any) => p.id === r.resource_product_id),
        }));
      }
    }

    return { product, resources };
  });

// ─── Admin: list all non-bundle products (for bundle resource picker) ─────────

export const listSingleProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("career_tool_products")
      .select("id, slug, title, resource_type, preview_image_url, status")
      .eq("product_type", "single_template")
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Admin: upsert career product ────────────────────────────────────────────

export const upsertCareerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => CareerProductInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    if (data.id) {
      // Update
      const { data: row, error } = await context.supabase
        .from("career_tool_products")
        .update({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          description: data.description,
          product_type: data.product_type,
          resource_type: data.resource_type,
          category: data.category,
          tags: data.tags,
          suitable_for: data.suitable_for,
          features: data.features,
          ats_friendly: data.ats_friendly,
          file_format: data.file_format,
          file_url: data.file_url,
          download_file_name: data.download_file_name,
          preview_image_url: data.preview_image_url,
          original_price: data.original_price,
          current_price: data.current_price,
          is_free: data.is_free,
          status: data.status,
          pinned: data.pinned,
          sort_order: data.sort_order,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          og_image: data.og_image,
          source_url: data.source_url,
          license: data.license,
          license_url: data.license_url,
          attribution_required: data.attribution_required,
          attribution_text: data.attribution_text,
        })
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Trigger ZIP regeneration for any bundles containing this updated product
      const { data: relatedBundles } = await context.supabase
        .from("bundle_resources")
        .select("bundle_product_id")
        .eq("resource_product_id", data.id);
      
      if (relatedBundles && relatedBundles.length > 0) {
        // Await generation so the zip is guaranteed to exist
        try {
          await Promise.all(relatedBundles.map(b => generateBundleZip(b.bundle_product_id)));
        } catch (err) {
          console.error("Failed to regenerate zips after product update:", err);
        }
      }

      return row;
    } else {
      // Insert
      const { data: row, error } = await context.supabase
        .from("career_tool_products")
        .insert({
          slug: data.slug,
          title: data.title,
          short_description: data.short_description,
          description: data.description,
          product_type: data.product_type,
          resource_type: data.resource_type,
          category: data.category,
          tags: data.tags,
          suitable_for: data.suitable_for,
          features: data.features,
          ats_friendly: data.ats_friendly,
          file_format: data.file_format,
          file_url: data.file_url,
          download_file_name: data.download_file_name,
          preview_image_url: data.preview_image_url,
          original_price: data.original_price,
          current_price: data.current_price,
          is_free: data.is_free,
          status: data.status,
          pinned: data.pinned,
          sort_order: data.sort_order,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          og_image: data.og_image,
          source_url: data.source_url,
          license: data.license,
          license_url: data.license_url,
          attribution_required: data.attribution_required,
          attribution_text: data.attribution_text,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
  });

// ─── Admin: delete career product ────────────────────────────────────────────

export const deleteCareerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("career_tool_products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Admin: update status ─────────────────────────────────────────────────────

export const updateCareerProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "published", "archived"]) }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("career_tool_products")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Admin: toggle pin ────────────────────────────────────────────────────────

export const togglePinCareerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({ id: z.string().uuid(), pinned: z.boolean() }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("career_tool_products")
      .update({ pinned: data.pinned })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Internal: Generate Bundle ZIP ─────────────────────────────────────────────

export async function generateBundleZip(bundleId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Fetch bundle details
  const { data: bundle, error: bundleError } = await supabaseAdmin
    .from("career_tool_products")
    .select("title")
    .eq("id", bundleId)
    .single();

  if (bundleError || !bundle) {
    console.error(`[generateBundleZip] Failed to fetch bundle ${bundleId}:`, bundleError);
    return;
  }

  // Fetch all resources for the bundle
  const { data: resources, error: resourcesError } = await supabaseAdmin
    .from("bundle_resources")
    .select(`
      resource_product_id,
      career_tool_products!bundle_resources_resource_product_id_fkey (
        file_url,
        download_file_name,
        title
      )
    `)
    .eq("bundle_product_id", bundleId)
    .order("sort_order", { ascending: true });

  if (resourcesError || !resources) {
    console.error(`[generateBundleZip] Failed to fetch resources for bundle ${bundleId}:`, resourcesError);
    return;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const resource of resources) {
    const product = resource.career_tool_products;
    if (!product || !product.file_url) continue;

    try {
      const { data, error } = await supabaseAdmin.storage
        .from("career-tools")
        .download(product.file_url);

      if (error || !data) {
        console.error(`[generateBundleZip] Failed to download resource ${product.file_url}:`, error);
        continue;
      }

      const buffer = await data.arrayBuffer();
      const origExt = product.file_url.split('.').pop() || '';
      
      let baseName = product.download_file_name || product.title || 'resource';
      if (origExt && !baseName.endsWith(`.${origExt}`)) {
        baseName = `${baseName}.${origExt}`;
      }

      // Handle filename collisions safely
      let finalName = baseName;
      let counter = 1;
      while (usedNames.has(finalName)) {
        const nameWithoutExt = baseName.substring(0, baseName.lastIndexOf('.')) || baseName;
        const ext = baseName.substring(baseName.lastIndexOf('.')) || '';
        finalName = `${nameWithoutExt} (${counter})${ext}`;
        counter++;
      }
      
      usedNames.add(finalName);
      zip.file(finalName, buffer);
    } catch (err) {
      console.error(`[generateBundleZip] Exception processing resource ${product.file_url}:`, err);
    }
  }

  try {
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipPath = `packs/${bundleId}/pack.zip`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("career-tools")
      .upload(zipPath, zipBuffer, {
        upsert: true,
        contentType: "application/zip",
      });

    if (uploadError) {
      console.error(`[generateBundleZip] Failed to upload ZIP for bundle ${bundleId}:`, uploadError);
    } else {
      console.log(`[generateBundleZip] Successfully generated and uploaded ZIP for bundle ${bundleId} to ${zipPath}`);
    }
  } catch (err) {
    console.error(`[generateBundleZip] Exception generating/uploading ZIP for bundle ${bundleId}:`, err);
  }
}

// ─── Admin: upsert bundle resources ──────────────────────────────────────────

export const upsertBundleResources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({
      bundle_id: z.string().uuid(),
      resources: z.array(
        z.object({ resource_product_id: z.string().uuid(), sort_order: z.number() })
      ),
    }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Delete existing resources for this bundle
    await context.supabase
      .from("bundle_resources")
      .delete()
      .eq("bundle_product_id", data.bundle_id);

    if (data.resources.length === 0) return { ok: true };

    // Re-insert in new order
    const inserts = data.resources.map((r) => ({
      bundle_product_id: data.bundle_id,
      resource_product_id: r.resource_product_id,
      sort_order: r.sort_order,
    }));

    const { error } = await context.supabase.from("bundle_resources").insert(inserts);
    if (error) throw new Error(error.message);
    
    // Regenerate bundle ZIP synchronously to guarantee it exists
    try {
      await generateBundleZip(data.bundle_id);
    } catch (err) {
      console.error("Failed to regenerate zip after resource upsert:", err);
    }
    
    return { ok: true };
  });

// ─── Admin: get signed download URL ──────────────────────────────────────────
// Used server-side only; never exposes storage keys to client

export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) =>
    z.object({ product_id: z.string().uuid() }).parse(i)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: product } = await context.supabase
      .from("career_tool_products")
      .select("file_url, status, download_file_name")
      .eq("id", data.product_id)
      .maybeSingle();
    if (!product?.file_url) throw new Error("No file uploaded for this product");
    if (product.status !== "published") throw new Error("Product not published");

    // Use service role client for storage (only server-side)
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SERVICE_KEY) throw new Error("Storage configuration error");

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Extract extension to append to custom filename
    const extMatch = product.file_url.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1]}` : "";
    const downloadParam = product.download_file_name 
      ? `${product.download_file_name.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`
      : true;

    const { data: signedData, error } = await adminClient.storage
      .from("career-tools")
      .createSignedUrl(product.file_url, 300, { download: downloadParam }); // 5 minute signed URL

    if (error) throw new Error("Failed to generate download link");
    return { url: signedData.signedUrl };
  });

// ─── Public: get public signed download URL (for published products) ──────────

export const getPublicDownloadUrl = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(i)
  )
  .handler(async ({ data }) => {
    const { data: product } = await supabase
      .from("career_tool_products")
      .select("file_url, status, title, download_file_name")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!product) throw new Error("Product not found");
    if (!product.file_url) throw new Error("Download not yet available for this product");

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SERVICE_KEY) throw new Error("Download service unavailable");

    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    
    const extMatch = product.file_url.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1]}` : "";
    const downloadParam = product.download_file_name 
      ? `${product.download_file_name.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`
      : true;

    const { data: signedData, error } = await adminClient.storage
      .from("career-tools")
      .createSignedUrl(product.file_url, 300, { download: downloadParam });

    if (error) throw new Error("Failed to generate download link");
    return { url: signedData.signedUrl, title: product.title };
  });
