import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { track } from "@/lib/analytics-tracking";

/**
 * AnalyticsTracker - Global page_view tracker.
 * Mounted inside RootComponent. Fires one page_view per navigation.
 * Renders nothing to the DOM.
 */
export function AnalyticsTracker() {
  const router = useRouter();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const loc = router.state.location;
    // search may be a string or an object in TanStack Router; use href when available
    const path: string =
      typeof loc.href === "string"
        ? loc.href
        : loc.pathname + (typeof loc.searchStr === "string" ? loc.searchStr : "");

    if (lastPath.current === path) return;
    lastPath.current = path;
    track({ event_type: "page_view", path: path.slice(0, 500) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.state.location.pathname]);

  return null;
}