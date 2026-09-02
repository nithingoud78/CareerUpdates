import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adConfig } from "./ad-config";
import { getAdsConfig } from "@/lib/ads-config.functions";

interface AdContextType {
  enabled: boolean;
  adBlockDetected: boolean | null; // null = unknown/loading/ads-off
}

const AdContext = createContext<AdContextType>({
  enabled: false,
  adBlockDetected: null,
});

export function useAdContext() {
  return useContext(AdContext);
}

export function AdProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = router.state.location.pathname;

  // 1. Excluded routes: never load ads, Monetag, or run AdBlock detection.
  //    Covers /admin, /admin/*, /auth, /auth/* regardless of global ads state.
  const isExcludedRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/ats-checker" ||
    pathname.startsWith("/ats-checker/") ||
    pathname === "/ats-friendly-resumes" ||
    pathname.startsWith("/ats-friendly-resumes/") ||
    pathname === "/ats-resumes-pack" ||
    pathname.startsWith("/ats-resumes-pack/");

  // 2. Fetch the global ads ON/OFF state from the server.
  //    CRITICAL: While loading (isLoading=true), treat ads as OFF to prevent
  //    the adblock detection from firing before we know the global state.
  //    This stops the "Please Disable Your Ad Blocker" popup from appearing
  //    during the initial load.
  //    On error, the query returns undefined — we treat that as ON (safe
  //    fallback per spec §18: never confuse a backend error with an ad blocker).
  const fetchConfig = useServerFn(getAdsConfig);
  const {
    data: adsConfigData,
    isLoading: isConfigLoading,
    isError: isConfigError,
  } = useQuery({
    queryKey: ["ads-global-config"],
    queryFn: () => fetchConfig(),
    staleTime: 60_000,         // 1 minute
    refetchInterval: 120_000,  // re-poll every 2 min (catches auto-re-enable)
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Determine global ads enabled:
  // - While loading: false (hold off — don't start detection yet)
  // - On error: true (safe fallback — backend error ≠ ad blocker)
  // - On success: use actual value from DB
  const globalAdsEnabled = isConfigLoading
    ? false
    : isConfigError
      ? true
      : (adsConfigData?.ads_enabled ?? true);

  // 3. All three conditions must be true to activate Monetag + detection:
  //    - build-time env flag
  //    - not an excluded route (/admin/*, /auth/*)
  //    - global DB switch is ON (and not still loading)
  const adsEnabled = adConfig.enabled && !isExcludedRoute && globalAdsEnabled;

  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    // CRITICAL: If global ads are OFF (or still loading), reset detection state
    // and do NOT inject the Monetag script or run any adblock detection.
    // adBlockDetected must stay null so AdBlockNotice never renders.
    if (!adsEnabled) {
      setAdBlockDetected(null);
      return;
    }

    let isResolved = false;

    // Fallback timeout for silent DNS/network blocks that don't trigger onerror
    const timer = setTimeout(() => {
      if (!isResolved) {
        setAdBlockDetected(true);
      }
    }, 4500);

    // Inject Monetag script only once per page session
    const existingScript = document.querySelector(
      `script[src="${adConfig.scriptUrl}"]`,
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = adConfig.scriptUrl;
      script.async = true;
      script.setAttribute("data-zone", adConfig.zoneId);
      script.setAttribute("data-cfasync", "false");

      script.onload = () => {
        isResolved = true;
        setAdBlockDetected(false);
      };

      script.onerror = () => {
        isResolved = true;
        // Script blocked at network level — most common adblock behaviour.
        setAdBlockDetected(true);
      };

      document.head.appendChild(script);
    } else {
      // Script already present from a previous route — treat as loaded.
      isResolved = true;
      // We can't reliably determine if it's loaded or blocked at this point,
      // so leave adBlockDetected as-is (already set by initial run).
    }

    return () => clearTimeout(timer);
  }, [adsEnabled]);

  return (
    <AdContext.Provider value={{ enabled: adsEnabled, adBlockDetected }}>
      {children}
    </AdContext.Provider>
  );
}
