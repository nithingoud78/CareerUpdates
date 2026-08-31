import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, User, Tag, ChevronLeft, ArrowRight } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import { StickySocial } from "@/components/sticky-social";
import { JobCard } from "@/components/job-card";
import { getBlogBySlug, getRelatedBlogs, getRelatedJobsForBlog } from "@/lib/blog.functions";
import { track } from "@/lib/analytics-tracking";


export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    return await context.queryClient.ensureQueryData({
      queryKey: ["blog", params.slug],
      queryFn: () => getBlogBySlug({ data: params.slug }),
    });
  },
  head: ({ params, loaderData }) => {
    const post = loaderData as any;
    const siteUrl = "https://careerupdates.co.in";
    const title = post?.seo_title || post?.title || "Blog — Career Updates";
    const desc = post?.seo_description || post?.excerpt || "Read this article on Career Updates.";
    
    return {
      meta: [
        { title: `${title} — Career Updates` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Career Updates" },
        { property: "og:url", content: `${siteUrl}/blog/${params.slug}` },
        ...(post?.cover_image ? [{ property: "og:image", content: post.cover_image }] : [{ property: "og:image", content: `${siteUrl}/careerupdates-share-2026.png` }]),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${siteUrl}/blog/${params.slug}` }],
      scripts: post ? [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BlogPosting",
                "@id": `${siteUrl}/blog/${params.slug}`,
                "headline": title,
                "description": desc,
                "author": {
                  "@type": "Person",
                  "name": post.author || "Career Updates Team"
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Career Updates",
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/android-chrome-512.png`
                  }
                },
                "datePublished": post.published_at || post.created_at,
                "dateModified": post.updated_at || post.published_at || post.created_at,
                ...(post.cover_image ? { "image": post.cover_image } : {})
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
                  { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
                  { "@type": "ListItem", "position": 3, "name": title, "item": `${siteUrl}/blog/${params.slug}` }
                ]
              }
            ]
          }),
        },
      ] : [],
    };
  },
  component: BlogDetail,
});

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogDetail() {
  const { slug } = Route.useParams();
  const blog = Route.useLoaderData();

  // Track blog_view once on mount
  useEffect(() => {
    if ((blog as any)?.id) {
      track({ event_type: "blog_view", path: `/blog/${slug}`, blog_id: (blog as any).id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(blog as any)?.id]);

  const getRelated = useServerFn(getRelatedBlogs);
  const getRelatedJobs = useServerFn(getRelatedJobsForBlog);

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

  const { data: relatedJobsData } = useQuery({
    queryKey: ["related-jobs", slug, (blog as any)?.category],
    queryFn: () => getRelatedJobs({ data: { category: (blog as any)?.category ?? undefined, limit: 4 } }),
    enabled: !!blog,
  });

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
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

          {/* Related Jobs Loop */}
          {relatedJobsData && relatedJobsData.length > 0 && (
            <div className="mt-16 border-t border-border pt-12">
              <h2 className="text-2xl font-bold mb-6">Explore Open Roles</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {relatedJobsData.map((job: any) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <StickySocial />
    </div>
  );
}
