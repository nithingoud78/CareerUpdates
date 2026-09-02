import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  Globe,
  EyeOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  getCareerProductById,
  updateCareerProductStatus,
  deleteCareerProduct,
} from "@/lib/career-tools.functions";
import { BundleDetailView } from "@/components/career-tools/bundle-detail-view";

export const Route = createFileRoute("/_authenticated/admin/resume-packs/$id/")({
  component: AdminPackOverview,
});

function AdminPackOverview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getCareerProductById);
  const setStatus = useServerFn(updateCareerProductStatus);
  const del = useServerFn(deleteCareerProduct);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["career-product", id],
    queryFn: () => get({ data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["career-product", id] });

  const changeStatus = useMutation({
    mutationFn: (status: any) => setStatus({ data: { id, status } }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => del({ data: { id } }),
    onSuccess: () => navigate({ to: "/admin/resume-packs" }),
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4 p-6"><div className="h-8 w-48 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>;
  }
  if (!response || !response.product) {
    return <div className="p-6">Pack not found</div>;
  }

  const bundle = response.product as any;
  const isPublished = bundle.status === "published";
  const isArchived = bundle.status === "archived";
  const publicUrl = `${window.location.origin}/resume-bundles/${bundle.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    alert("Link copied!");
  }

  const adminActions = (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/admin/resume-packs/$id/edit"
        params={{ id }}
        className="flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
      >
        <Pencil className="h-4 w-4" /> Edit
      </Link>
      
      {isPublished ? (
        <button onClick={() => changeStatus.mutate("draft")} className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-accent">
          <EyeOff className="h-4 w-4" /> Unpublish
        </button>
      ) : (
        <button onClick={() => changeStatus.mutate("published")} className="flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
          <Globe className="h-4 w-4" /> Publish
        </button>
      )}

      {isArchived ? (
        <button onClick={() => changeStatus.mutate("draft")} className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-accent">
          <ArchiveRestore className="h-4 w-4" /> Unarchive
        </button>
      ) : (
        <button onClick={() => changeStatus.mutate("archived")} className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <Archive className="h-4 w-4" /> Archive
        </button>
      )}
      
      <button onClick={() => { if(confirm("Delete this pack?")) remove.mutate(); }} className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <Trash2 className="h-4 w-4" /> Delete
      </button>
      
      <button onClick={copyLink} className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-accent">
        <Copy className="h-4 w-4" /> Copy Link
      </button>
      
      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-accent">
        <ExternalLink className="h-4 w-4" /> Open Public Page
      </a>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/resume-packs"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Pack Preview</h1>
        
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isPublished ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            isArchived ? "bg-muted text-muted-foreground" :
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {bundle.status.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="rounded-2xl border border-border bg-background p-6">
        <BundleDetailView 
          product={bundle} 
          resources={response.resources ?? []}
          relatedBundles={[]} 
          adminActions={adminActions} 
        />
      </div>
    </div>
  );
}
