import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Global module-level cache persists across renders for the lifetime of the page
// Prevents duplicate fetches and flicker on re-renders
const logoCache = new Set<string>();
const failedCache = new Set<string>();

interface CompanyLogoProps {
  url?: string | null;
  name?: string;
  className?: string;
  /** Job ID — when provided, triggers Supabase Storage caching after first successful load */
  jobId?: string;
  /** Set true for above-the-fold logos to prioritize their fetch */
  priority?: boolean;
}

export const CompanyLogo = React.memo(function CompanyLogo({
  url,
  name,
  className,
  jobId,
  priority = false,
}: CompanyLogoProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !url ? "error" : failedCache.has(url) ? "error" : logoCache.has(url) ? "success" : "loading",
  );

  useEffect(() => {
    if (!url) {
      setStatus("error");
      return;
    }
    if (failedCache.has(url)) {
      setStatus("error");
      return;
    }
    if (logoCache.has(url)) {
      setStatus("success");
      return;
    }
    setStatus("loading");
  }, [url]);

  const handleError = () => {
    if (url) failedCache.add(url);
    setStatus("error");
  };

  const handleLoad = () => {
    if (url) logoCache.add(url);
    setStatus("success");

    // Trigger background logo caching to Supabase Storage (fire-and-forget)
    // Only for external URLs (skip if already on our storage or no jobId)
    if (jobId && url && !url.includes("supabase.co/storage")) {
      import("@/lib/logo-cache.functions").then(({ cacheLogoToStorage }) => {
        cacheLogoToStorage({ data: { jobId, logoUrl: url } }).catch(() => {
          // Silent — storage might not be configured yet
        });
      });
    }
  };

  if (status === "error" || !url) {
    const initials = name
      ? name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : null;

    return (
      <div
        className={cn(
          "grid h-full w-full place-items-center bg-brand/10 text-brand font-bold text-sm",
          className,
        )}
      >
        {initials || <Building2 className="h-1/2 w-1/2 opacity-50" />}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-white", className)}>
      <img
        src={url}
        alt={name ? `${name} logo` : "Company logo"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // fetchpriority is a valid HTML attribute but not in React types yet
        {...({ fetchpriority: priority ? "high" : "low" } as any)}
        width="128"
        height="128"
        crossOrigin="anonymous"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-300",
          status === "loading" ? "opacity-0" : "opacity-100",
        )}
      />
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted/50" />
      )}
    </div>
  );
});
