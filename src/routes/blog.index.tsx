import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Calendar, ArrowRight, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StickySocial } from "@/components/sticky-social";
import { getPublishedBlogs, getFeaturedBlog, getBlogCategories } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Career Updates" },
      { name: "description", content: "Career tips, interview guides, and industry news from Career Updates." },
      { property: "og:title", content: "Blog — Career Updates" },
      { property: "og:description", content: "Career tips, interview guides, and industry news from Career Updates." },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogIndex,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function BlogIndex() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 9;

  const getBlogs = useServerFn(getPublishedBlogs);
  const getFeatured = useServerFn(getFeaturedBlog);
  const getCategories = useServerFn(getBlogCategories);

  const { data: featuredPost } = useQuery({
    queryKey: ["featured-blog"],
    queryFn: () => getFeatured(),
  });

  const { data: categoriesList } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: () => getCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["published-blogs", page, search, category],
    queryFn: () => getBlogs({ data: { page, limit: LIMIT, search: search || undefined, category: category || undefined } }),
  });

  const blogs = (data?.blogs ?? []) as any[];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero header */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Blog</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Career Insights</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Interview tips, industry news, and career guides curated for you.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link
            to="/blog/$slug"
            params={{ slug: (featuredPost as any).slug }}
            className="group mb-12 block overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm transition-shadow hover:shadow-md"
          >
            {(featuredPost as any).cover_image && (
              <div className="h-56 w-full overflow-hidden sm:h-72">
                <img
                  src={(featuredPost as any).cover_image}
                  alt={(featuredPost as any).title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
                {(featuredPost as any).category && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                    {(featuredPost as any).category}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl group-hover:text-brand transition-colors">
                {(featuredPost as any).title}
              </h2>
              {(featuredPost as any).excerpt && (
                <p className="mt-3 line-clamp-2 text-muted-foreground">{(featuredPost as any).excerpt}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate((featuredPost as any).published_at ?? (featuredPost as any).created_at)}
                </span>
                <span>{(featuredPost as any).author}</span>
                <span className="ml-auto flex items-center gap-1 text-brand font-medium">
                  Read article <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
          {/* Main listing */}
          <div>
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles..."
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90"
              >
                Search
              </button>
            </form>

            {/* Posts grid */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                {search || category ? "No articles found. Try a different search." : "No articles published yet."}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {blogs.map((blog: any) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-accent disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm hover:bg-accent disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            {((categoriesList as any[]) ?? []).length > 0 && (
              <div className="rounded-xl border border-border/50 bg-surface/50 p-5">
                <h3 className="mb-3 text-sm font-semibold">Categories</h3>
                <ul className="space-y-1.5">
                  <li>
                    <button
                      onClick={() => { setCategory(""); setPage(1); }}
                      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                        !category ? "bg-brand/10 text-brand font-medium" : "text-muted-foreground"
                      }`}
                    >
                      All Articles
                    </button>
                  </li>
                  {((categoriesList as string[]) ?? []).map((cat) => (
                    <li key={cat}>
                      <button
                        onClick={() => { setCategory(cat); setPage(1); }}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent ${
                          category === cat ? "bg-brand/10 text-brand font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-5 text-center">
              <p className="text-sm font-semibold">Get daily job alerts</p>
              <p className="mt-1 text-xs text-muted-foreground">Join our Telegram & WhatsApp channels.</p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href="https://t.me/careerupdate_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-telegram px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Join Telegram
                </a>
                <a
                  href="https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-whatsapp px-4 py-1.5 text-xs font-semibold text-white"
                >
                  WhatsApp Channel
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}

function BlogCard({ blog }: { blog: any }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: blog.slug }}
      className="group block overflow-hidden rounded-xl border border-border/50 bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      {blog.cover_image ? (
        <div className="h-36 w-full overflow-hidden">
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-gradient-to-br from-brand/10 to-brand/5">
          <span className="text-3xl font-bold text-brand/30">{blog.title.charAt(0)}</span>
        </div>
      )}
      <div className="p-4">
        {blog.category && (
          <span className="mb-2 inline-block rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {blog.category}
          </span>
        )}
        <h3 className="font-semibold line-clamp-2 group-hover:text-brand transition-colors">{blog.title}</h3>
        {blog.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {formatDate(blog.published_at ?? blog.created_at)}
        </p>
      </div>
    </Link>
  );
}
