import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Compass, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Career Updates" },
      { name: "description", content: "Career Updates is a curated discovery platform for official job opportunities, internships and government careers." },
      { property: "og:title", content: "About — Career Updates" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  const pillars = [
    { icon: Compass, title: "Curated, not crawled", text: "Every opportunity is hand-reviewed before publishing — no expired posts, no spam." },
    { icon: Sparkles, title: "AI-summarised", text: "Quick 2-3 sentence overviews so you understand the role at a glance." },
    { icon: Shield, title: "Apply on official site", text: "We link directly to the company's career page. Your data goes only to them." },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-brand">About us</p>
        <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          A simpler way to discover <span className="text-brand">official</span> career openings.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground">
          Career Updates is a curated discovery platform. We watch the official career pages of
          companies, government bodies and universities so you can spend less time searching and
          more time applying.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="glass rounded-2xl p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-xl font-bold text-foreground">Our mission</h2>
          <p>
            We believe finding genuine career opportunities should be free and frictionless. We do not
            charge candidates, sell resumes, or insert ourselves between you and the recruiter. The
            Apply button always goes to the official company page.
          </p>
          <h2 className="pt-4 text-xl font-bold text-foreground">How we curate</h2>
          <p>
            Each posting is verified for authenticity, deadline and source. We add a short AI-generated
            summary, SEO description and tags to help you skim quickly. Listings expire automatically
            once the deadline passes.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
