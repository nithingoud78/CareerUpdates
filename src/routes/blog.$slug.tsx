import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, User, Tag, ChevronLeft, ArrowRight } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdSlot } from "@/components/ad-slot";
import { StickySocial } from "@/components/sticky-social";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/blog.functions";


export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const siteUrl = "https://careerupdates.co.in";
    return {
      meta: [
        { title: "Blog — Career Updates" },
        { name: "description", content: "Read this article on Career Updates." },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Career Updates" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${siteUrl}/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
              { "@type": "ListItem", position: 3, name: "Article", item: `${siteUrl}/blog/${params.slug}` },
            ],
          }),
        },
      ],
    };
  },
  component: BlogDetail,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogDetail() {
  const { slug } = Route.useParams();

  const getPost = useServerFn(getBlogBySlug);
  const getRelated = useServerFn(getRelatedBlogs);

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => getPost({ data: slug }),
  });

  const { data: related } = useQuery({
    queryKey: ["related-blogs", slug, (blog as any)?.category],
    queryFn: () =>
      getRelated({
        data: {
          slug,
          category: (blog as any)?.category ?? undefined,
          limit: 3,
        },
      }),
    enabled: !!blog,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-10 w-3/4 rounded bg-muted" />
            <div className="h-64 rounded-xl bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-muted" style={{ width: `${85 + Math.random() * 15}%` }} />
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <p className="mt-2 text-muted-foreground">This article may have been removed or the URL is incorrect.</p>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-1 text-brand hover:underline">
            <ChevronLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const post = blog as any;
  const renderedContent = post.content ? renderMarkdown(post.content) : "";
  const relatedPosts = (related as any[]) ?? [];
  const metaTitle = post.seo_title || post.title;
  const metaDesc = post.seo_description || post.excerpt || "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Cover image */}
        {post.cover_image && (
          <div className="h-72 w-full overflow-hidden sm:h-96">
            <img src={post.cover_image} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
            {/* Article */}
            <article>
              {/* Breadcrumb */}
              <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                <Link to="/blog" className="hover:text-foreground">Blog</Link>
                <span>/</span>
                {post.category && (
                  <>
                    <span>{post.category}</span>
                    <span>/</span>
                  </>
                )}
                <span className="line-clamp-1">{post.title}</span>
              </div>

              {/* Category badge */}
              {post.category && (
                <span className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                  {post.category}
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.published_at ?? post.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
              </div>

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Top Ad */}
              <AdSlot />

              {/* Content */}
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert mt-8 max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-brand prose-a:no-underline hover:prose-a:underline
                  prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs
                  prose-pre:rounded-xl prose-pre:bg-muted prose-pre:p-4
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:marker:text-brand
                  prose-blockquote:border-brand/50 prose-blockquote:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />

              {/* Bottom Ad */}
              <AdSlot />

              {/* Back link */}
              <div className="mt-12 border-t border-border pt-6">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to all articles
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="rounded-xl border border-border/50 bg-surface/50 p-5">
                  <h3 className="mb-4 text-sm font-semibold">Related Articles</h3>
                  <ul className="space-y-4">
                    {relatedPosts.map((r: any) => (
                      <li key={r.id}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug: r.slug }}
                          className="group block"
                        >
                          {r.cover_image && (
                            <img
                              src={r.cover_image}
                              alt={r.title}
                              className="mb-2 h-24 w-full rounded-lg object-cover"
                            />
                          )}
                          <p className="text-sm font-medium line-clamp-2 group-hover:text-brand transition-colors">
                            {r.title}
                          </p>
                          {r.published_at && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(r.published_at)}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Channel CTA */}
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-5 text-center">
                <p className="text-sm font-semibold">Get job alerts daily</p>
                <p className="mt-1 text-xs text-muted-foreground">Join our community channels.</p>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href="https://t.me/careerupdate_in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-telegram px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Telegram
                  </a>
                  <a
                    href="https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-whatsapp px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
