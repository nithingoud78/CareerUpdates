import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Career Updates" },
      { name: "description", content: "How Career Updates handles your data, cookies and third-party services." },
      { property: "og:title", content: "Privacy Policy — Career Updates" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate dark:prose-invert mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Overview</h2>
            <p>
              Career Updates ("we", "us") is a job discovery platform. We do not collect resumes,
              passwords or personal application data — every Apply button redirects to the official
              employer's career page, where their privacy policy applies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Information we collect</h2>
            <p>
              We collect anonymous analytics (page views, search queries, referrer) to understand
              which opportunities are most useful. Contact form submissions are used solely to reply
              to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Cookies and advertising</h2>
            <p>
              We use cookies for basic site functionality and theme preference. Third-party
              advertising partners (e.g. Google AdSense) may set cookies to display relevant ads
              based on your prior visits to this and other sites. You can opt out of personalized
              advertising at{" "}
              <a className="text-brand underline" href="https://www.google.com/settings/ads">
                Google Ad Settings
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Third-party links</h2>
            <p>
              Job listings link to external company websites. We are not responsible for the privacy
              practices, content or accuracy of those external sites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your rights</h2>
            <p>
              You may request deletion of any data we hold about you by contacting us at{" "}
              <a href="mailto:careerupdates.in@gmail.com" className="text-brand hover:underline">
                careerupdates.in@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be reflected by
              updating the "Last updated" date at the top of this page.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
