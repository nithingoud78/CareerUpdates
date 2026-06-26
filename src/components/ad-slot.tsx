import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;

interface AdSlotProps {
  /** AdSense slot ID — read from env or passed as prop. Falls back to placeholder. */
  slotId?: string;
  label?: string;
  className?: string;
  format?: "auto" | "horizontal" | "rectangle";
}

/**
 * AdSlot — Google AdSense-ready component.
 *
 * Behaviour:
 * - If VITE_ADSENSE_PUBLISHER_ID env var is missing → shows placeholder (current behaviour).
 * - If env var is present → renders real <ins class="adsbygoogle"> tag and pushes to adsbygoogle.
 * - No hardcoded Publisher or Slot IDs.
 *
 * To activate AdSense after approval:
 * 1. Add VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX to .env
 * 2. Add VITE_ADSENSE_SLOT_DEFAULT=XXXXXXXXXX to .env (or pass slotId prop per slot)
 * 3. The AdSense <script> tag is injected automatically by this component.
 */
export function AdSlot({ slotId, label = "Advertisement", className, format = "auto" }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);
  const injectedScript = useRef(false);

  const resolvedSlot = slotId || (import.meta.env.VITE_ADSENSE_SLOT_DEFAULT as string | undefined);

  useEffect(() => {
    if (!PUBLISHER_ID || !resolvedSlot) return;

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
  }, [resolvedSlot]);

  // Show placeholder when AdSense not configured
  if (!PUBLISHER_ID || !resolvedSlot) {
    return (
      <div className="flex justify-center w-full my-6 overflow-hidden">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground",
            "w-full max-w-[320px] h-[100px] sm:max-w-[468px] sm:h-[60px] md:max-w-[728px] md:h-[90px]",
            className,
          )}
          aria-label="Ad placement"
        >
          {label}
        </div>
      </div>
    );
  }

  // Real AdSense slot
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
