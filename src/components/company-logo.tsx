import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Global cache to prevent flickering
const logoCache = new Set<string>();
const failedCache = new Set<string>();

interface CompanyLogoProps {
  url?: string | null;
  name?: string;
  className?: string;
}

export function CompanyLogo({ url, name, className }: CompanyLogoProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    url ? (failedCache.has(url) ? "error" : logoCache.has(url) ? "success" : "loading") : "error"
  );

  useEffect(() => {
    if (!url) {
      setStatus("error");
      return;
    }
    
    if (logoCache.has(url)) {
      setStatus("success");
      return;
    }
    
    if (failedCache.has(url)) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const img = new Image();
    img.src = url;
    img.onload = () => {
      logoCache.add(url);
      setStatus("success");
    };
    img.onerror = () => {
      failedCache.add(url);
      setStatus("error");
    };
  }, [url]);

  if (status === "error") {
    const initials = name
      ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
      : null;

    return (
      <div className={cn("grid h-full w-full place-items-center bg-brand/10 text-brand font-bold text-sm", className)}>
        {initials || <Building2 className="h-1/2 w-1/2 opacity-50" />}
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <img
        src={url!}
        alt={name ? `${name} logo` : "Company logo"}
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
}
