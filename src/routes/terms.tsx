import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const EFFECTIVE_DATE = "26 June 2025";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Career Updates" },
      {
        name: "description",
        content:
          "Read the Terms & Conditions for Career Updates. Understand your rights and responsibilities when using our job discovery platform.",
      },
      { property: "og:title", content: "Terms & Conditions — Career Updates" },
      { property: "og:description", content: "Read the Terms & Conditions for Career Updates — a free job discovery platform." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://careerupdates.co.in/terms" },
      { property: "og:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Terms & Conditions — Career Updates" },
      { name: "twitter:description", content: "Read the Terms & Conditions for Career Updates." },
      { name: "twitter:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
    ],
    links: [{ rel: "canonical", href: "https://careerupdates.co.in/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Career Updates ("we", "us", "our") at{" "}
              <a href="https://careerupdates.co.in" className="text-brand hover:underline">
                careerupdates.co.in
              </a>
              , you agree to be bound by these Terms &amp; Conditions. If you do not agree with any
              part of these terms, you must discontinue use of the website immediately. These terms
              apply to all visitors, users, and others who access or use the service.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">2. Use of Website</h2>
            <p>
              Career Updates grants you a limited, non-exclusive, non-transferable, revocable license
              to access and use the website for personal, non-commercial purposes. You agree not to:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Reproduce, duplicate, copy, sell or exploit any portion of the service without express written permission.</li>
              <li>Use the platform to distribute spam, unsolicited messages, or fraudulent content.</li>
              <li>Attempt to gain unauthorised access to any portion of the website or its related systems.</li>
              <li>Interfere with or disrupt the integrity or performance of the service.</li>
              <li>Use automated tools, scrapers, bots, or crawlers to harvest job listings in bulk without permission.</li>
            </ul>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Job Listings</h2>
            <p>
              Career Updates aggregates job listings sourced from official company career pages,
              government portals, and publicly available institutional sources. We do not create,
              post, or own the jobs listed on this platform. We act solely as an informational
              intermediary. All job listings are provided "as is" and are subject to change at any
              time at the discretion of the hiring organisation. Career Updates does not guarantee
              the availability of any position, nor do we represent or act on behalf of any employer.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">4. External Links</h2>
            <p>
              Our website contains links to third-party websites, including employer career pages and
              application portals. These links are provided for your convenience. Career Updates has
              no control over the content, privacy policies, or practices of any third-party websites.
              We expressly disclaim all responsibility for the accuracy, legality, or security of any
              content found on linked external sites. Clicking an external link is done entirely at
              your own risk.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              All original content on Career Updates — including but not limited to text, design,
              graphics, logos, AI-generated job summaries, and source code — is the intellectual
              property of Career Updates and is protected under applicable copyright laws. You may not
              reproduce, redistribute, or create derivative works from our proprietary content without
              prior written consent. Job descriptions sourced from external organisations remain the
              intellectual property of their respective owners.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">6. User Responsibilities</h2>
            <p>
              As a user of Career Updates, you are solely responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Verifying the authenticity and current availability of any job listing before applying.</li>
              <li>Ensuring that you meet the eligibility criteria specified by the hiring organisation.</li>
              <li>Safeguarding any personal information submitted to third-party employer portals.</li>
              <li>Reporting to us any listing that appears fraudulent, misleading, or inappropriate.</li>
            </ul>
            <p className="mt-3">
              Career Updates will never ask you for money, payment, or financial details in exchange
              for applying to a job or accessing any feature on this platform.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Accuracy of Information</h2>
            <p>
              While we make every reasonable effort to ensure that job listings are accurate,
              up-to-date, and sourced from verified origins, we cannot guarantee the completeness or
              correctness of all information published. Job details including salary, location,
              eligibility, and deadlines may change after publication. Career Updates accepts no
              liability for decisions made on the basis of information displayed on this platform.
              Users are strongly encouraged to visit the official employer career page to confirm all
              details before submitting an application.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">8. Third-Party Services</h2>
            <p>
              Career Updates uses third-party services to operate and improve the platform, including
              but not limited to Google Analytics (web analytics), Google AdSense (advertising),
              Supabase (database and authentication), and Vercel (hosting). Use of these services is
              governed by their respective terms of service and privacy policies. By using Career
              Updates, you acknowledge that these third-party services may collect data in accordance
              with their own terms.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Career Updates and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages arising
              from your use of, or inability to use, the platform. This includes but is not limited
              to: missed job opportunities, application failures, data loss, or harm resulting from
              fraudulent job listings published by third parties. Career Updates' total liability for
              any claim arising under these terms shall not exceed the amount you have paid to us,
              which in most cases will be zero, as the service is free.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">10. Changes to Terms</h2>
            <p>
              Career Updates reserves the right to modify these Terms &amp; Conditions at any time.
              Changes will take effect immediately upon being posted to this page. The "Effective
              date" at the top of this document will be updated to reflect the most recent revision.
              Your continued use of the website following any changes constitutes your acceptance of
              the revised terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">11. Contact Information</h2>
            <p>
              If you have any questions, concerns, or feedback regarding these Terms &amp; Conditions,
              please contact us at:
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Career Updates</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:careerupdates.in@gmail.com"
                className="text-brand hover:underline"
              >
                careerupdates.in@gmail.com
              </a>
              <br />
              Website:{" "}
              <a href="https://careerupdates.co.in" className="text-brand hover:underline">
                careerupdates.co.in
              </a>
            </p>
          </section>

        </div>

        {/* Internal links */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/privacy" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Privacy Policy
          </Link>
          <Link to="/disclaimer" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Disclaimer
          </Link>
          <Link to="/contact" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Contact Us
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
