import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Global cache to prevent flickering and avoid duplicate load errors
const logoCache = new Set<string>();
const failedCache = new Set<string>();

interface CompanyLogoProps {
  url?: string | null;
  name?: string;
  className?: string;
}

export const CompanyLogo = React.memo(function CompanyLogo({ url, name, className }: CompanyLogoProps) {
  // If no URL or known to fail, start in error state. If known success, start success.
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !url ? "error" : failedCache.has(url) ? "error" : logoCache.has(url) ? "success" : "loading"
  );

  useEffect(() => {
    // Reset state if URL changes
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
  };

  if (status === "error" || !url) {
    const initials = name
      ? name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase()
      : null;

    return (
      <div className={cn("grid h-full w-full place-items-center bg-brand/10 text-brand font-bold text-sm", className)}>
        {initials || <Building2 className="h-1/2 w-1/2 opacity-50" />}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-white", className)}>
      <img
        src={url}
        alt={name ? `${name} logo` : "Company logo"}
        loading="lazy"
        decoding="async"
        width="128"
        height="128"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "h-full w-full object-contain transition-opacity duration-300",
          status === "loading" ? "opacity-0" : "opacity-100"
        )}
      />
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted/50" />
      )}
    </div>
  );
});
