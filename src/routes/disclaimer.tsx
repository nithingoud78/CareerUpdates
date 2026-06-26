import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const EFFECTIVE_DATE = "26 June 2025";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Career Updates" },
      {
        name: "description",
        content:
          "Read the Career Updates disclaimer. We are an informational job discovery platform and are not affiliated with listed companies. Jobs are sourced from official career pages.",
      },
      { property: "og:title", content: "Disclaimer — Career Updates" },
      { property: "og:description", content: "Career Updates is an informational job discovery platform. Read our full disclaimer before applying." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://careerupdates.co.in/disclaimer" },
      { property: "og:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Disclaimer — Career Updates" },
      { name: "twitter:description", content: "Career Updates is an informational job discovery platform. Read our full disclaimer." },
      { name: "twitter:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
    ],
    links: [{ rel: "canonical", href: "https://careerupdates.co.in/disclaimer" }],
  }),
  component: Disclaimer,
});

const POINTS = [
  {
    title: "Informational Platform Only",
    body: "Career Updates is a free job discovery and aggregation platform. All content published on this website is for general informational purposes only. Nothing on this platform constitutes professional career advice, legal advice, or a formal job offer of any kind.",
  },
  {
    title: "Job Listings Are Sourced From Official Pages",
    body: "All job listings displayed on Career Updates are sourced from publicly available, official company career pages, government job portals, and verified institutional websites. We aggregate and curate this information to make it more accessible to job seekers. We do not create or fabricate job opportunities.",
  },
  {
    title: "No Affiliation With Listed Companies",
    body: "Career Updates is an independent platform and is NOT affiliated with, endorsed by, or officially associated with any company, government body, or institution whose job listings appear on this website unless explicitly stated. The use of company names, logos, or trademarks is solely for the purpose of identification and reference.",
  },
  {
    title: "We Do Not Guarantee Recruitment",
    body: "Publishing a job listing on Career Updates does not guarantee that you will be shortlisted, interviewed, or recruited for any position. All hiring decisions are made exclusively by the respective companies and organisations. Career Updates has no influence over their selection process.",
  },
  {
    title: "Verify Before Applying",
    body: "Job details including eligibility criteria, application deadlines, salary, location, and role responsibilities may change after publication. Users are strongly advised to visit the official company career page to verify all job details before submitting an application. Career Updates accepts no responsibility for decisions made based on information that has since changed.",
  },
  {
    title: "Career Updates Is Always Free",
    body: "Career Updates does not charge candidates any fees to browse, search, or apply for any job listed on this platform. If you are asked to pay money in exchange for a job offer, application processing, or access to listings by anyone claiming to represent Career Updates, please be aware that this is a scam. We will never request payment of any kind.",
  },
  {
    title: "Beware of Recruitment Scams",
    body: "Job seekers should exercise caution and stay vigilant against fraudulent job offers. Scammers sometimes impersonate legitimate job portals or companies to extract personal information or money from applicants. Always verify that the company and role are genuine through official channels before sharing sensitive personal information or making any payment. Career Updates will never contact you via unofficial channels to ask for money or personal data.",
  },
  {
    title: "External Links Disclaimer",
    body: "Our website contains links to third-party external websites, including employer career portals and application platforms. These links are provided solely as a convenience to users. Career Updates does not control, endorse, or take responsibility for the content, privacy practices, security, or accuracy of any external website. Accessing external links is done entirely at your own risk.",
  },
  {
    title: "Accuracy of Information",
    body: "While Career Updates makes every effort to ensure that published job listings are accurate, current, and sourced from verified origins, we make no representations or warranties of any kind regarding the completeness, reliability, suitability, or availability of the information. Any reliance you place on such information is strictly at your own risk.",
  },
  {
    title: "No Liability",
    body: "To the maximum extent permitted by applicable law, Career Updates shall not be held liable for any direct, indirect, incidental, consequential, or special damages arising from your use of this platform, missed job applications, reliance on inaccurate listing information, or exposure to fraudulent third-party content.",
  },
];

function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Disclaimer</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>

        {/* Warning banner */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Important:</strong> Career Updates is a free
            informational platform. We are not affiliated with any employer and we never charge money
            for jobs. If anyone asks you to pay for a listing, it is a scam.
          </p>
        </div>

        <div className="mt-10 space-y-5 text-sm leading-relaxed text-muted-foreground">
          {POINTS.map((point, i) => (
            <section key={point.title} className="glass rounded-2xl p-6">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {i + 1}. {point.title}
              </h2>
              <p>{point.body}</p>
            </section>
          ))}
        </div>

        {/* Internal links */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/terms" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Privacy Policy
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
