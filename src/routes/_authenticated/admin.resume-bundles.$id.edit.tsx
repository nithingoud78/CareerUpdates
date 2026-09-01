import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import {
  getCareerProductById,
  upsertCareerProduct,
  upsertBundleResources,
  listSingleProducts,
} from "@/lib/career-tools.functions";
import { AdminProductForm, type ProductFormData } from "@/components/career-tools/admin-product-form";
import { BundleResourcesManager } from "@/components/career-tools/bundle-resources-manager";

export const Route = createFileRoute("/_authenticated/admin/resume-bundles/$id/edit")({
  component: EditBundle,
});

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  referral_message: "Referral Message",
  cold_email: "Cold Email",
};

function EditBundle() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getById = useServerFn(getCareerProductById);
  const save = useServerFn(upsertCareerProduct);
  const saveResources = useServerFn(upsertBundleResources);
  const getProducts = useServerFn(listSingleProducts);
  const [error, setError] = useState<string | null>(null);
  const [bundleResources, setBundleResources] = useState<{ resource_product_id: string; sort_order: number }[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["career-bundle-edit", id],
    queryFn: () => getById({ data: { id } }),
  });

  useEffect(() => {
    if (bundleResources === null && data?.resources) {
      setBundleResources(
        data.resources.map((r: any) => ({
          resource_product_id: r.resource_product_id,
          sort_order: r.sort_order,
        }))
      );
    }
  }, [data, bundleResources]);

  const { data: allSingleProducts = [], refetch: refetchProducts } = useQuery({
    queryKey: ["single-products-list"],
    queryFn: () => getProducts(),
  });

  const mut = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      await save({
        data: {
          ...formData,
          id,
          product_type: "bundle",
          short_description: formData.short_description || null,
          description: formData.description || null,
          category: formData.category || null,
          file_format: formData.file_format || null,
          file_url: formData.file_url || null,
          preview_image_url: formData.preview_image_url || null,
          seo_title: formData.seo_title || null,
          seo_description: formData.seo_description || null,
          og_image: formData.og_image || null,
          source_url: formData.source_url || null,
          license: formData.license || null,
          license_url: formData.license_url || null,
          attribution_text: formData.attribution_text || null,
        } as any,
      });

      await saveResources({
        data: {
          bundle_id: id,
          resources: bundleResources ?? [],
        },
      });
    },
    onSuccess: () => navigate({ to: "/admin/resume-bundles" }),
    onError: (err: any) => setError(err.message || "Failed to save bundle."),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/50" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="max-w-3xl py-20 text-center text-muted-foreground">
        <p>Bundle not found.</p>
      </div>
    );
  }

  const p = data.product;
  const initial: Partial<ProductFormData> = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    product_type: "bundle",
    resource_type: p.resource_type,
    category: p.category ?? "",
    tags: p.tags ?? [],
    suitable_for: p.suitable_for ?? [],
    features: p.features ?? [],
    ats_friendly: p.ats_friendly,
    file_format: p.file_format ?? "",
    file_url: p.file_url,
    preview_image_url: p.preview_image_url,
    original_price: p.original_price,
    current_price: p.current_price,
    status: p.status,
    pinned: p.pinned,
    sort_order: p.sort_order,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    og_image: p.og_image ?? "",
    source_url: p.source_url ?? "",
    license: p.license ?? "",
    license_url: p.license_url ?? "",
    attribution_required: p.attribution_required,
    attribution_text: p.attribution_text ?? "",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Bundle</h1>
        <p className="text-sm text-muted-foreground truncate">{p.title}</p>
      </div>

      <BundleResourcesManager
        resources={bundleResources || []}
        onChange={setBundleResources}
        allProducts={allSingleProducts}
        onResourceCreated={refetchProducts}
      />

      <AdminProductForm
        productType="bundle"
        initial={initial}
        isPending={mut.isPending}
        error={error}
        onSubmit={(formData) => mut.mutate(formData)}
        backHref="/admin/resume-bundles"
        backLabel="Cancel"
      />
    </div>
  );
}
