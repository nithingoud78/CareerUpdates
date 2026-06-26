import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GoogleAnalytics } from "../components/google-analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">404</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground">Page not found</h1>
        <h2 className="mt-4 text-base font-medium text-muted-foreground">
          The page you're looking for doesn't exist or may have been moved.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you were looking for a job, it may have expired or been removed after its deadline passed.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-105 sm:w-auto"
          >
            Back to Home
          </Link>
          <Link
            to="/search"
            className="inline-flex w-full items-center justify-center rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:w-auto"
          >
            Browse Latest Jobs
          </Link>
        </div>
        <Link
          to="/search"
          className="mt-4 inline-block text-sm text-brand hover:underline"
        >
          Search all jobs →
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Career Updates — Latest Jobs & Career Opportunities" },
      {
        name: "description",
        content:
          "Curated official job openings, internships and career updates. Apply directly via verified company career pages.",
      },
      { name: "author", content: "Career Updates" },
      { property: "og:title", content: "Career Updates — Latest Jobs & Career Opportunities" },
      { property: "og:description", content: "Find your next career opportunity. Curated official job openings, internships and career updates." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Career Updates" },
      { property: "og:url", content: "https://careerupdates.co.in" },
      { property: "og:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@careerupdates" },
      { name: "twitter:title", content: "Career Updates — Latest Jobs & Career Opportunities" },
      { name: "twitter:description", content: "Find your next career opportunity. Curated official job openings, internships and career updates." },
      { name: "twitter:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
      { name: "theme-color", content: "#8b5cf6" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      // Performance: preconnect to external logo/favicon CDNs
      { rel: "preconnect", href: "https://logo.clearbit.com" },
      { rel: "dns-prefetch", href: "https://www.google.com" },
      { rel: "dns-prefetch", href: "https://bcsoykjrwnrzkqacnkgr.supabase.co" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://careerupdates.co.in/#organization",
              name: "Career Updates",
              url: "https://careerupdates.co.in",
              logo: {
                "@type": "ImageObject",
                url: "https://careerupdates.co.in/careerupdates-share-2026.png",
                width: 1200,
                height: 630,
              },
              sameAs: [
                "https://t.me/careerupdate_in",
                "https://whatsapp.com/channel/0029VbDWQziFi8xUacpWjx2K",
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://careerupdates.co.in/#website",
              url: "https://careerupdates.co.in",
              name: "Career Updates",
              publisher: { "@id": "https://careerupdates.co.in/#organization" },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://careerupdates.co.in/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  loader: async () => {
    try {
      console.error("[DEBUG] Executing __root loader");
    } catch (err: any) {
      console.error("[DEBUG] SSR CRASH in __root loader:", err.message);
      console.error("[DEBUG] Stack:", err.stack);
      throw err;
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <GoogleAnalytics />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6032482437020204"
          crossOrigin="anonymous"
        ></script>
        <Scripts />
      </head>
      <body className="overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
