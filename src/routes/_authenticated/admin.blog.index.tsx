import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, Pencil, Star, StarOff, BookOpen, Eye, EyeOff } from "lucide-react";
import { listAllBlogs, deleteBlog, toggleBlogFeatured, updateBlogStatus } from "@/lib/blog.functions";

export const Route = createFileRoute("/_authenticated/admin/blog/")({
  component: BlogDashboard,
});

function BlogDashboard() {
  const list = useServerFn(listAllBlogs);
  const del = useServerFn(deleteBlog);
  const toggleFeatured = useServerFn(toggleBlogFeatured);
  const changeStatus = useServerFn(updateBlogStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: () => list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blogs"] }),
  });

  const feature = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      toggleFeatured({ data: { id, featured } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blogs"] }),
  });

  const status = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      changeStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blogs"] }),
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const blogs = (data ?? []) as any[];
  const filtered = blogs
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()));

  const total = blogs.length;
  const published = blogs.filter((b) => b.status === "published").length;
  const draft = blogs.filter((b) => b.status === "draft").length;
  const featured = blogs.filter((b) => b.featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">Manage blog posts and articles.</p>
        </div>
        <Link
          to="/admin/blog/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: total, icon: BookOpen },
          { label: "Published", value: published, icon: Eye },
          { label: "Drafts", value: draft, icon: EyeOff },
          { label: "Featured", value: featured, icon: Star },
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                filter === f ? "bg-brand text-brand-foreground" : "hover:bg-accent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading posts…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {search ? "No posts match your search." : "No blog posts yet. Create one!"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Date</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((blog: any) => (
                <tr key={blog.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {blog.featured && <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
                      <span className="font-medium line-clamp-1">{blog.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">/blog/{blog.slug}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {blog.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        blog.status === "published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {blog.published_at
                      ? new Date(blog.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : new Date(blog.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle featured */}
                      <button
                        title={blog.featured ? "Unfeature" : "Feature"}
                        onClick={() => feature.mutate({ id: blog.id, featured: !blog.featured })}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-yellow-500"
                      >
                        {blog.featured ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                      </button>
                      {/* Toggle published */}
                      <button
                        title={blog.status === "published" ? "Unpublish" : "Publish"}
                        onClick={() =>
                          status.mutate({
                            id: blog.id,
                            status: blog.status === "published" ? "draft" : "published",
                          })
                        }
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                      >
                        {blog.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {/* Edit */}
                      <Link
                        to="/admin/blog/$id/edit"
                        params={{ id: blog.id }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${blog.title}"?`)) remove.mutate(blog.id);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
