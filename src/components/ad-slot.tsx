import { useEffect, useRef } from "react";
import { adsConfig } from "@/lib/ads.config";

/**
 * AdSlot — Future-ready advertising component.
 *
 * CURRENT BEHAVIOUR (adsEnabled = false):
 *   Renders nothing. No placeholder, no empty box, no dashed border, no label.
 *   Content above and below this component flows together naturally.
 *
 * FUTURE BEHAVIOUR (when AdSense is approved and adsEnabled = true):
 *   1. Set adsConfig.adsEnabled = true  in src/lib/ads.config.ts
 *   2. Set adsConfig.adProvider = "google_adsense"
 *   3. Add VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX to .env
 *   4. Optionally add VITE_ADSENSE_SLOT_DEFAULT=XXXXXXXXXX (or pass slotId prop)
 *   The component will inject the AdSense script and render the <ins> tag.
 *
 * ADMIN PAGES:
 *   This component must NOT be used inside /admin routes.
 *   The admin panel is always ad-free.
 */

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;

interface AdSlotProps {
  /** AdSense slot ID — read from env or passed as prop. */
  slotId?: string;
  /** Reserved for future use — not displayed while ads are disabled. */
  label?: string;
  className?: string;
  format?: "auto" | "horizontal" | "rectangle";
}

export function AdSlot({ slotId, format = "auto" }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const injectedScript = useRef(false);

  const resolvedSlot = slotId || (import.meta.env.VITE_ADSENSE_SLOT_DEFAULT as string | undefined);

  // Ads disabled OR no valid provider: render nothing at all.
  const adsActive =
    adsConfig.adsEnabled &&
    adsConfig.adProvider === "google_adsense" &&
    !!PUBLISHER_ID &&
    !!resolvedSlot;

  useEffect(() => {
    if (!adsActive) return;

    // Inject the AdSense script only once per page
    if (!injectedScript.current && typeof document !== "undefined") {
      const existing = document.querySelector(`script[src*="adsbygoogle"]`);
      if (!existing) {
        const script = document.createElement("script");
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
      injectedScript.current = true;
    }

    // Push ad after a short delay to ensure ins is mounted
    const timer = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {
        // Silently ignore if AdSense not ready yet
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adsActive, resolvedSlot]);

  // ── Ads disabled / not configured → render nothing ──────────────────────
  if (!adsActive) {
    return null;
  }

  // ── Real AdSense slot ────────────────────────────────────────────────────
  return (
    <div className="flex justify-center w-full my-6 overflow-hidden">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: 90 }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={resolvedSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
