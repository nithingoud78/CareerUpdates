import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { adConfig } from "./ad-config";

interface AdContextType {
  enabled: boolean;
  adBlockDetected: boolean | null; // null = unknown
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

  // 1. Disable ads on admin pages
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const adsEnabled = adConfig.enabled && !isAdminRoute;

  const [adBlockDetected, setAdBlockDetected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!adsEnabled) return;

    let isResolved = false;

    // Fallback timeout for silent DNS/network blocks that don't trigger onerror
    const timer = setTimeout(() => {
      if (!isResolved) {
        setAdBlockDetected(true);
      }
    }, 4500);

    // We only want to inject the script once
    const existingScript = document.querySelector(`script[src="${adConfig.scriptUrl}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = adConfig.scriptUrl;
      script.async = true;
      script.setAttribute("data-zone", adConfig.zoneId);
      script.setAttribute("data-cfasync", "false");
      
      script.onload = () => {
        isResolved = true;
        setAdBlockDetected(false); // Script loaded successfully
      };
      
      script.onerror = () => {
        isResolved = true;
        // Script was blocked at network level (most common adblock behavior)
        setAdBlockDetected(true);
      };
      
      document.head.appendChild(script);
    } else {
      isResolved = true;
    }

    return () => clearTimeout(timer);
  }, [adsEnabled]);

  return (
    <AdContext.Provider value={{ enabled: adsEnabled, adBlockDetected }}>
      {children}
    </AdContext.Provider>
  );
}
