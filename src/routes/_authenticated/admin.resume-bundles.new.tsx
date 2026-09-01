import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { X, Plus, GripVertical } from "lucide-react";
import { upsertCareerProduct, upsertBundleResources, listSingleProducts } from "@/lib/career-tools.functions";
import { AdminProductForm, defaultProductFormData, type ProductFormData } from "@/components/career-tools/admin-product-form";
import { BundleResourcesManager } from "@/components/career-tools/bundle-resources-manager";

export const Route = createFileRoute("/_authenticated/admin/resume-bundles/new")({
  component: NewBundle,
});



function NewBundle() {
  const navigate = useNavigate();
  const save = useServerFn(upsertCareerProduct);
  const saveResources = useServerFn(upsertBundleResources);
  const getProducts = useServerFn(listSingleProducts);
  const [error, setError] = useState<string | null>(null);
  const [bundleResources, setBundleResources] = useState<{ resource_product_id: string; sort_order: number }[]>([]);

  const { data: allSingleProducts = [], refetch: refetchProducts } = useQuery({
    queryKey: ["single-products-list"],
    queryFn: () => getProducts(),
  });

  const mut = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const row = await save({
        data: {
          ...data,
          product_type: "bundle",
          short_description: data.short_description || null,
          description: data.description || null,
          category: data.category || null,
          file_format: data.file_format || null,
          file_url: data.file_url || null,
          preview_image_url: data.preview_image_url || null,
          seo_title: data.seo_title || null,
          seo_description: data.seo_description || null,
          og_image: data.og_image || null,
          source_url: data.source_url || null,
          license: data.license || null,
          license_url: data.license_url || null,
          attribution_text: data.attribution_text || null,
        } as any,
      }) as any;

      // Save bundle resources
      if (bundleResources.length > 0) {
        await saveResources({
          data: {
            bundle_id: row.id,
            resources: bundleResources,
          },
        });
      }
      return row;
    },
    onSuccess: () => navigate({ to: "/admin/resume-bundles" }),
    onError: (err: any) => setError(err.message || "Failed to create bundle."),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Bundle</h1>
        <p className="text-sm text-muted-foreground">Create a new product bundle.</p>
      </div>

      <BundleResourcesManager
        resources={bundleResources}
        onChange={setBundleResources}
        allProducts={allSingleProducts}
        onResourceCreated={refetchProducts}
      />

      <AdminProductForm
        productType="bundle"
        initial={{
          ...defaultProductFormData,
          product_type: "bundle",
          original_price: 499,
          current_price: 79,
          category: "Bundle",
        }}
        isPending={mut.isPending}
        error={error}
        onSubmit={(data) => mut.mutate(data)}
        backHref="/admin/resume-bundles"
        backLabel="Cancel"
      />
    </div>
  );
}
