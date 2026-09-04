import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { upsertCareerProduct, upsertBundleResources, listDmatModulesAdmin } from "@/lib/career-tools.functions";
import { AdminProductForm, defaultProductFormData, type ProductFormData } from "@/components/career-tools/admin-product-form";
import { BundleResourcesManager } from "@/components/career-tools/bundle-resources-manager";

export const Route = createFileRoute("/_authenticated/admin/dmat-complete/new")({
  component: NewDmatComplete,
});

function NewDmatComplete() {
  const navigate = useNavigate();
  const save = useServerFn(upsertCareerProduct);
  const saveResources = useServerFn(upsertBundleResources);
  const getProducts = useServerFn(listDmatModulesAdmin);
  const [error, setError] = useState<string | null>(null);
  const [bundleResources, setBundleResources] = useState<{ resource_product_id: string; sort_order: number }[]>([]);

  const { data: allSingleProducts = [], refetch: refetchProducts } = useQuery({
    queryKey: ["admin-dmat-modules-list"],
    queryFn: () => getProducts(),
  });

  const mut = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const row = await save({
        data: {
          ...data,
          product_type: "bundle",
          resource_type: "all_modules",
          is_free: data.is_free,
          short_description: data.short_description || null,
          description: data.description || null,
          category: data.category || null,
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
    onSuccess: () => navigate({ to: "/admin/dmat-complete" }),
    onError: (err: any) => setError(err.message || "Failed to save pack."),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New dMAT Complete Pack</h1>
        <p className="text-sm text-muted-foreground">Create a new dMAT complete bundle pack.</p>
      </div>

      <BundleResourcesManager
        resources={bundleResources}
        onChange={setBundleResources}
        allProducts={allSingleProducts}
        onResourceCreated={refetchProducts}
      />

      <AdminProductForm
        productType="bundle"
        initial={{ ...defaultProductFormData, product_type: "bundle", resource_type: "all_modules" }}
        isPending={mut.isPending}
        error={error}
        onSubmit={(data) => mut.mutate(data)}
        backHref="/admin/dmat-complete"
        backLabel="Cancel"
      />
    </div>
  );
}
