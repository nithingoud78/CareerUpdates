import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getCareerProductById, upsertCareerProduct } from "@/lib/career-tools.functions";
import { AdminProductForm, type ProductFormData } from "@/components/career-tools/admin-product-form";

export const Route = createFileRoute("/_authenticated/admin/resume-templates/$id/edit")({
  component: EditResumeTemplate,
});

function EditResumeTemplate() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getById = useServerFn(getCareerProductById);
  const save = useServerFn(upsertCareerProduct);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["career-product-edit", id],
    queryFn: () => getById({ data: { id } }),
  });

  const mut = useMutation({
    mutationFn: (formData: ProductFormData) =>
      save({
        data: {
          ...formData,
          id,
          is_free: formData.is_free,
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
      }),
    onSuccess: () => navigate({ to: "/admin/resume-templates" }),
    onError: (err: any) => setError(err.message || "Failed to save."),
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
        <p className="font-medium">Template not found.</p>
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
    product_type: p.product_type,
    resource_type: p.resource_type,
    category: p.category ?? "",
    tags: p.tags ?? [],
    suitable_for: p.suitable_for ?? [],
    features: p.features ?? [],
    ats_friendly: p.ats_friendly ?? false,
    file_format: p.file_format ?? "",
    file_url: p.file_url,
    download_file_name: p.download_file_name ?? null,
    preview_image_url: p.preview_image_url,
    original_price: p.original_price,
    current_price: p.current_price,
    is_free: p.is_free ?? false,
    status: p.status,
    pinned: p.pinned ?? false,
    sort_order: p.sort_order ?? 0,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    og_image: p.og_image ?? "",
    source_url: p.source_url ?? "",
    license: p.license ?? "",
    license_url: p.license_url ?? "",
    attribution_required: p.attribution_required ?? false,
    attribution_text: p.attribution_text ?? "",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Template</h1>
        <p className="text-sm text-muted-foreground truncate">{p.title}</p>
      </div>
      <AdminProductForm
        productType="single_template"
        initial={initial}
        isPending={mut.isPending}
        error={error}
        onSubmit={(formData) => mut.mutate(formData)}
        backHref="/admin/resume-templates"
        backLabel="Cancel"
      />
    </div>
  );
}
