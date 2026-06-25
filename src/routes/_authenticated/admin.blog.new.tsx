import { createFileRoute } from "@tanstack/react-router";
import { BlogEditor } from "@/components/blog-editor";

export const Route = createFileRoute("/_authenticated/admin/blog/new")({
  component: NewBlog,
});

function NewBlog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Blog Post</h1>
        <p className="text-sm text-muted-foreground">Write and publish a new article.</p>
      </div>
      <BlogEditor />
    </div>
  );
}
