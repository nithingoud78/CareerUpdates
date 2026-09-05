import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const EFFECTIVE_DATE = "26 June 2025";

export const Route = createFileRoute("/refund-cancellation")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Career Updates" },
      {
        name: "description",
        content: "Read the Refund & Cancellation Policy for Career Updates digital products and resources.",
      },
      { property: "og:title", content: "Refund & Cancellation Policy — Career Updates" },
      { property: "og:description", content: "Read our Refund & Cancellation Policy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://careerupdates.co.in/refund-cancellation" },
      { property: "og:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Refund & Cancellation Policy — Career Updates" },
      { name: "twitter:description", content: "Read our Refund & Cancellation Policy." },
      { name: "twitter:image", content: "https://careerupdates.co.in/careerupdates-share-2026.png" },
    ],
    links: [{ rel: "canonical", href: "https://careerupdates.co.in/refund-cancellation" }],
  }),
  component: RefundCancellation,
});

function RefundCancellation() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Refund &amp; Cancellation Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          
          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Job Discovery is Free</h2>
            <p>
              Career Updates does not charge candidates to browse, search, or apply for jobs.
              Job applications are handled directly by the relevant employer or their official portal.
              Since there is no payment involved in job discovery on our platform, no refunds apply to this service.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">2. Paid Digital Products</h2>
            <p>
              Career Updates offers paid digital resources, which may include:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>ATS Resume Templates</li>
              <li>ATS Resume Packs</li>
              <li>dMAT Modules</li>
              <li>dMAT Complete Packs</li>
              <li>Other downloadable career/educational resources</li>
            </ul>
            <p className="mt-3">
              Payment is considered successful once confirmed by our payment processor.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Delivery &amp; Cancellation Limitations</h2>
            <p>
              Our digital products are delivered electronically. Once a payment is successful, the customer is immediately provided with download access or a direct link to the digital file.
            </p>
            <p className="mt-3">
              Due to the nature of digital goods (which can be downloaded and copied immediately), we generally do not offer cancellations or refunds once the product has been accessed or downloaded. We urge you to read the product descriptions carefully before making a purchase.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Refund &amp; Resolution Conditions</h2>
            <p>
              While all digital sales are generally final, we are committed to customer satisfaction and will offer a reasonable resolution or a refund under the following specific circumstances:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li><strong>Failed Downloads:</strong> If your payment is successful but you do not receive the download link or access to the file.</li>
              <li><strong>Corrupted Files:</strong> If the downloaded file is inaccessible, corrupted, or defective, and our support team cannot provide a working replacement.</li>
              <li><strong>Duplicate Payments:</strong> If you were mistakenly charged twice for the exact same transaction.</li>
            </ul>
            <p className="mt-3">
              In these cases, you must contact our support team within 7 days of the purchase date to request a resolution or refund.
            </p>
          </section>

          <section className="glass rounded-2xl p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">5. How to Contact Support</h2>
            <p>
              If you experience any issues with a digital download, please contact our support team immediately so we can assist you.
            </p>
            <p className="mt-3">
              <strong>Email:</strong> <a href="mailto:careerupdates.in@gmail.com" className="text-brand hover:underline">careerupdates.in@gmail.com</a>
            </p>
            <p className="mt-3">
              When contacting us, please include your order details, the email address used for the purchase, and a description of the issue.
            </p>
          </section>

        </div>

        {/* Internal links */}
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/terms" className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Terms &amp; Conditions
          </Link>
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
