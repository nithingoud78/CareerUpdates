import { useEffect } from "react";
import { useAdContext } from "./ad-provider";

export function AdBlockNotice() {
  const { enabled, adBlockDetected } = useAdContext();

  useEffect(() => {
    // If ad block is detected, prevent scrolling on the body
    if (enabled && adBlockDetected === true) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [enabled, adBlockDetected]);

  if (!enabled || adBlockDetected !== true) {
    return null;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xl text-center">
        <h2 className="text-xl font-bold text-foreground">
          Please Disable Your Ad Blocker
        </h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Ads help us keep Career Updates free. Please disable your ad blocker or private DNS to continue using the website.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          After turning off your ad blocker or private DNS, please refresh the page.
        </p>
        <button
          onClick={handleRefresh}
          className="mt-8 w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
