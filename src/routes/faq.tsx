import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Career Updates FAQs | Frequently Asked Questions" },
      {
        name: "description",
        content:
          "Find answers to common questions about jobs, internships, applications, company hiring, notifications and Career Updates.",
      },
      { property: "og:title", content: "Career Updates FAQs | Frequently Asked Questions" },
      { property: "og:url", content: "/faq" },
      { property: "og:description", content: "Find answers to common questions about jobs, internships, applications, company hiring, notifications and Career Updates." },
      { name: "twitter:title", content: "Career Updates FAQs | Frequently Asked Questions" },
      { name: "twitter:description", content: "Find answers to common questions about jobs, internships, applications, company hiring, notifications and Career Updates." },
    ],
    links: [{ rel: "canonical", href: "https://careerupdates.co.in/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_SECTIONS.flatMap((s) =>
            s.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
              },
            }))
          ),
        }),
      },
    ],
  }),
  component: FaqPage,
});

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "General",
    items: [
      {
        q: "What is Career Updates?",
        a: "Career Updates is a free job discovery platform that curates official job openings, internships, and career opportunities directly from company career pages, government portals, and verified sources. We help job seekers find authentic opportunities without sifting through spam or expired listings.",
      },
      {
        q: "Is Career Updates free?",
        a: "Yes, 100% free — always. We do not charge candidates any fees to browse, search, or apply for jobs. We believe genuine career opportunities should be accessible to everyone.",
      },
      {
        q: "Are the jobs verified?",
        a: "Yes. Every listing is hand-reviewed or AI-verified before publishing. We check that the source is an official company career page or government portal, that the deadline is valid, and that the job details are accurate.",
      },
      {
        q: "Where do these jobs come from?",
        a: "Our jobs are sourced directly from official company career pages, government job portals, and trusted institution websites. We do not accept paid listings or unverified third-party submissions.",
      },
      {
        q: "Do I need an account to use Career Updates?",
        a: "No account is needed to browse, search, or apply for any job on Career Updates. Simply visit the site and start exploring opportunities right away.",
      },
    ],
  },
  {
    title: "Applications",
    items: [
      {
        q: "How do I apply for a job?",
        a: "Click on any job card to view the full details, then click the \"Apply Now\" button. You will be redirected directly to the official company career page or application portal to complete your application there.",
      },
      {
        q: "Does Career Updates recruit candidates directly?",
        a: "No. Career Updates is a discovery platform, not a recruiter. We do not collect resumes, conduct interviews, or make hiring decisions. All applications are handled entirely by the respective companies.",
      },
      {
        q: "Why am I redirected to another website when I apply?",
        a: "This is intentional and by design. We link directly to the official company or government application portal so your data goes only to the hiring organization — not to us. This protects your privacy and ensures your application is received by the right people.",
      },
      {
        q: "Can I apply for multiple jobs?",
        a: "Absolutely. You can apply to as many jobs as you like. Since applications are handled on the company's own website, simply open each job and follow their individual application process.",
      },
    ],
  },
  {
    title: "For Freshers",
    items: [
      {
        q: "Are there jobs for freshers and recent graduates?",
        a: "Yes. We regularly post entry-level positions, graduate trainee programs, campus recruitment drives, and fresher-friendly roles across IT, government, and business sectors. Use the \"Category\" filter to find roles suited to your profile.",
      },
      {
        q: "Do you post internships?",
        a: "Yes. Internships are a dedicated category on Career Updates. You can filter by \"Internship\" in the Category or Employment Type filter on the Search page to see all current internship openings.",
      },
      {
        q: "How often are new jobs updated?",
        a: "We update the platform daily. New jobs are added as soon as they are verified from official sources. We recommend checking back regularly or following our social channels for real-time alerts.",
      },
    ],
  },
  {
    title: "Notifications & Alerts",
    items: [
      {
        q: "How can I receive new job alerts?",
        a: "You can follow Career Updates on our Telegram channel and WhatsApp channel for instant job alerts the moment new opportunities are published. Links are available in the floating social buttons on the site.",
      },
      {
        q: "Where can I follow Career Updates?",
        a: "You can follow us on Telegram and WhatsApp via the social buttons visible on the site. These channels deliver real-time job notifications directly to your phone.",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        q: "Why can't I find an older job I saw before?",
        a: "Job listings are automatically archived once their application deadline passes. This keeps the platform clean and ensures you only see active, current opportunities. Expired jobs are no longer visible to the public.",
      },
      {
        q: "Why has a job disappeared from the listings?",
        a: "A job may be removed if: (1) the application deadline has passed, (2) the company has closed applications early, or (3) we discovered the listing was inaccurate or the source was unreliable. We proactively remove outdated listings to protect your time.",
      },
      {
        q: "Why is salary information missing for some jobs?",
        a: "Many companies — especially government bodies — do not publicly disclose the salary for a role until after the interview stage. When salary details are unavailable from the official source, we mark it as \"Not disclosed\" rather than showing inaccurate figures.",
      },
    ],
  },
  {
    title: "Privacy",
    items: [
      {
        q: "Does Career Updates collect my personal information?",
        a: "We collect minimal anonymous usage data (such as page views) to improve the platform. We do not ask for your name, resume, phone number, or personal details to use the site. Please read our Privacy Policy for full details.",
      },
      {
        q: "Is my job application shared with Career Updates?",
        a: "No. When you click \"Apply Now\" you are taken directly to the company's own application portal. Your application details, resume, and personal information are submitted only to that company — Career Updates never sees or stores any of it.",
      },
    ],
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Support</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently Asked <span className="text-brand">Questions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground">
            Everything you need to know about Career Updates, job applications, notifications and
            more.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="mt-14 space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand">
                {section.title}
              </h2>
              <div className="divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden">
                {section.items.map((item) => (
                  <AccordionItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Still have a question?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Contact Us
            </Link>
            <Link
              to="/terms"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Privacy
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const id = question.replace(/\s+/g, "-").toLowerCase();

  return (
    <div>
      <button
        id={`faq-btn-${id}`}
        aria-expanded={open}
        aria-controls={`faq-panel-${id}`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <span className="text-foreground">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        id={`faq-panel-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}
