import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Plus, Trash2, Pencil, Eye, EyeOff, Star, StarOff,
  FileText, Package, Archive, CheckCircle2, ExternalLink
} from "lucide-react";
import {
  listAllCareerProducts,
  deleteCareerProduct,
  updateCareerProductStatus,
  togglePinCareerProduct,
} from "@/lib/career-tools.functions";
import { resolvePreviewImageUrl } from "@/lib/image-utils";

export const Route = createFileRoute("/_authenticated/admin/dmat-module/")({
  component: AdminDmatModules,
});

const STATUS_COLORS: Record<string, string> = {
  published: "text-green-600 bg-green-50 dark:bg-green-950/30",
  draft: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  archived: "text-muted-foreground bg-muted",
};

function AdminDmatModules() {
  const list = useServerFn(listAllCareerProducts);
  const del = useServerFn(deleteCareerProduct);
  const setStatus = useServerFn(updateCareerProductStatus);
  const setPin = useServerFn(togglePinCareerProduct);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: allProducts, isLoading } = useQuery({
    queryKey: ["admin-career-products"],
    queryFn: () => list(),
  });

  const modules = (allProducts ?? []).filter((p: any) => p.product_type === "single_template" && p.resource_type === "single_module");

  const filtered = modules
    .filter((p: any) => filter === "all" || p.status === filter)
    .filter((p: any) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: modules.length,
    published: modules.filter((p: any) => p.status === "published").length,
    draft: modules.filter((p: any) => p.status === "draft").length,
    pinned: modules.filter((p: any) => p.pinned).length,
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-career-products"] });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { invalidate(); setConfirmDeleteId(null); },
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => setStatus({ data: { id, status } }),
    onSuccess: invalidate,
  });

  const pin = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => setPin({ data: { id, pinned } }),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">dMAT Modules</h1>
          <p className="text-sm text-muted-foreground">Manage individual dMAT module questions.</p>
        </div>
        <Link
          to="/admin/dmat-module/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          <Plus className="h-4 w-4" /> New Module
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: FileText },
          { label: "Published", value: stats.published, icon: Eye },
          { label: "Drafts", value: stats.draft, icon: EyeOff },
          { label: "Pinned", value: stats.pinned, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules…"
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm"
        />
        {(["all", "published", "draft", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === s ? "bg-brand text-brand-foreground" : "border border-border hover:bg-accent"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse h-16 rounded-xl bg-muted/50" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <FileText className="h-10 w-10 opacity-30" />
          <p className="font-medium">No modules found</p>
          <Link to="/admin/dmat-module/new" className="text-sm text-brand hover:underline">
            Create the first module →
          </Link>
        </div>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Module</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Pinned</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.preview_image_url ? (
                        <img src={resolvePreviewImageUrl(p.preview_image_url) || ""} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-muted/50">
                          <FileText className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <Link to="/admin/dmat-module/$id/edit" params={{ id: p.id }} className="font-medium leading-none hover:text-brand hover:underline">{p.title}</Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.category ?? p.resource_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground capitalize">
                      {p.resource_type?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      <s className="text-muted-foreground">₹{p.original_price}</s>{" "}
                      <strong>₹{p.current_price}</strong>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => changeStatus.mutate({ id: p.id, status: e.target.value as any })}
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[p.status] ?? ""}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => pin.mutate({ id: p.id, pinned: !p.pinned })}
                      title={p.pinned ? "Unpin" : "Pin"}
                      className="rounded-full p-1.5 hover:bg-accent"
                    >
                      {p.pinned ? (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {p.status === "published" && (
                        <>
                          <Link
                            to="/admin/dmat-module/$id"
                            params={{ id: p.id }}
                            className="rounded-full p-1.5 hover:bg-accent"
                            title="View Admin Overview"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Link>
                          <a
                            href={`/dmat-resources/modules/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-1.5 hover:bg-accent"
                            title="Open Public Link"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </>
                      )}
                      <Link
                        to="/admin/dmat-module/$id/edit"
                        params={{ id: p.id }}
                        className="rounded-full p-1.5 hover:bg-accent"
                        title="Edit Module"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      {p.status === "archived" ? (
                        <button
                          onClick={() => changeStatus.mutate({ id: p.id, status: "draft" })}
                          className="rounded-full p-1.5 hover:bg-accent"
                          title="Unarchive"
                        >
                          <Archive className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus.mutate({ id: p.id, status: "archived" })}
                          className="rounded-full p-1.5 hover:bg-accent"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4 text-muted-foreground opacity-50" />
                        </button>
                      )}
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => remove.mutate(p.id)}
                            disabled={remove.isPending}
                            className="rounded px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded px-2 py-1 text-[10px] font-bold border border-border hover:bg-accent"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="rounded-full p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Module"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
