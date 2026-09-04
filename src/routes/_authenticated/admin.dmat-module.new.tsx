import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { upsertCareerProduct } from "@/lib/career-tools.functions";
import { AdminProductForm, defaultProductFormData, type ProductFormData } from "@/components/career-tools/admin-product-form";

export const Route = createFileRoute("/_authenticated/admin/dmat-module/new")({
  component: NewDmatModule,
});

function NewDmatModule() {
  const navigate = useNavigate();
  const save = useServerFn(upsertCareerProduct);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (data: ProductFormData) =>
      save({
        data: {
          ...data,
          product_type: "single_template",
          resource_type: "single_module",
          is_free: data.is_free,
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
      }),
    onSuccess: () => navigate({ to: "/admin/dmat-module" }),
    onError: (err: any) => setError(err.message || "Failed to save module."),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New dMAT Module</h1>
        <p className="text-sm text-muted-foreground">Create a new dMAT module wise questions product.</p>
      </div>
      <AdminProductForm
        productType="single_template"
        initial={{ ...defaultProductFormData, product_type: "single_template", resource_type: "single_module" }}
        isPending={mut.isPending}
        error={error}
        onSubmit={(data) => mut.mutate(data)}
        backHref="/admin/dmat-module"
        backLabel="Cancel"
      />
    </div>
  );
}
