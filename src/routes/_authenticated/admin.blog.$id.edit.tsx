import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft } from "lucide-react";
import { getBlogForEdit } from "@/lib/blog.functions";
import { BlogEditor } from "@/components/blog-editor";

export const Route = createFileRoute("/_authenticated/admin/blog/$id/edit")({
  component: EditBlog,
});

function EditBlog() {
  const { id } = Route.useParams();
  const getForEdit = useServerFn(getBlogForEdit);

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-edit", id],
    queryFn: () => getForEdit({ data: id }),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading post…</div>;
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        Post not found.{" "}
        <Link to="/admin/blog" className="underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-sm text-muted-foreground line-clamp-1">{(data as any).title}</p>
        </div>
      </div>
      <BlogEditor initialData={data as any} />
    </div>
  );
}
