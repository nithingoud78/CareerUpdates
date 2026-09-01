import { useAdContext } from "./ad-provider";

export function AdBlockNotice() {
  const { enabled, adBlockDetected } = useAdContext();

  // Gate is only shown when ads are enabled AND an ad blocker is detected.
  // When this is false, the component renders nothing and the page is fully normal.
  const isGateActive = enabled && adBlockDetected === true;

  if (!isGateActive) {
    return null;
  }

  return (
    /*
     * Overlay layer:
     *   - position: fixed, inset: 0 — always covers the viewport regardless of scroll.
     *   - z-[9999] — sits above everything.
     *   - overflow-y-auto — lets the document behind it scroll naturally
     *     (the overlay itself does not block pointer-events on the document;
     *      the `inert` attribute on <Outlet /> in __root.tsx handles that).
     *   - backdrop-filter: blur — subtle frosted-glass effect.
     *   - background: semi-transparent, NOT opaque, so the page is visible behind.
     *   - pointer-events: auto — the overlay itself is clickable (Refresh button).
     */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adblock-notice-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        // Subtle frosted glass overlay — page remains visible behind it.
        // color-mix with --background adapts to both light and dark themes.
        background: "color-mix(in oklab, var(--background) 42%, transparent)",
        backdropFilter: "blur(6px) saturate(120%)",
        WebkitBackdropFilter: "blur(6px) saturate(120%)",
      }}
    >
      {/*
       * Modal card — uses the existing surface/glass style from the design system.
       * Max width keeps it compact; p-6/sm:p-8 gives comfortable spacing.
       */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface/95 p-6 sm:p-8 shadow-2xl text-center">
        {/* Shield icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-brand"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h2
          id="adblock-notice-title"
          className="text-lg font-bold text-foreground"
        >
          Please Disable Your Ad Blocker
        </h2>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Ads help us keep Career Updates free. Please disable your ad blocker
          or private DNS to continue using the website.
        </p>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          After turning off your ad blocker, please refresh the page.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
