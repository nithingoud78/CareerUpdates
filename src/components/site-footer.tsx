import { Link } from "@tanstack/react-router";


export function SiteFooter() {

  return (
    <footer className="mt-20 border-t border-border bg-surface pb-24 sm:pb-0">
      <div className="mx-auto flex flex-col gap-10 px-4 py-12 text-center sm:px-6 md:grid md:grid-cols-4 md:text-left lg:px-8">
        <div className="flex flex-col items-center md:col-span-2 md:items-start">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <img src="/custom-icon.png" alt="Logo icon" className="h-7 w-7 object-contain" />
            </span>
            Career Updates
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Curated official job opportunities, internships and career updates. We link you
            directly to verified company career pages so you can apply with confidence.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Latest Jobs</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
            <li><Link to="/disclaimer" className="hover:text-foreground">Disclaimer</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Career Updates. All rights reserved.</p>
          <p>Curated job opportunities, no spam.</p>
        </div>
      </div>
    </footer>
  );
}
