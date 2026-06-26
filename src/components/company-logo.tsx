import React, { useState, useEffect, useRef } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Module-level maps persist for the page lifetime so we never re-request
 * a URL we already know the outcome of.
 *
 * "success" — img loaded fine, skip everything
 * "error"   — all fallback strategies failed, show initials
 *
 * Keyed by the original URL so the same company logo is fetched at most once
 * regardless of how many cards share it.
 */
const logoResultCache = new Map<string, "success" | "error">();

/**
 * Build a Google Favicon API URL which:
 *  - works without CORS headers
 *  - is served from Google's CDN (very fast, no rate-limit for reasonable traffic)
 *  - returns a 1×1 placeholder instead of a 404 when the domain has no icon,
 *    so onError never fires for a "not found" — we handle that via onLoad size check
 */
function googleFaviconUrl(url: string): string | null {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    if (!domain || !domain.includes(".")) return null;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

/**
 * Extract a usable hostname from the stored logo URL.
 * Handles both Clearbit URLs and direct image URLs.
 */
function domainFromLogoUrl(logoUrl: string): string | null {
  try {
    const u = new URL(logoUrl);
    // Clearbit: https://logo.clearbit.com/google.com → "google.com"
    if (u.hostname === "logo.clearbit.com") {
      return u.pathname.replace(/^\//, "");
    }
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

interface CompanyLogoProps {
  url?: string | null;
  /** Permanent Supabase Storage URL — preferred over url when present */
  storageUrl?: string | null;
  name?: string;
  className?: string;
  jobId?: string;
  priority?: boolean;
}

export const CompanyLogo = React.memo(function CompanyLogo({
  url,
  storageUrl,
  name,
  className,
  priority = false,
}: CompanyLogoProps) {
  // Priority: storage_url > url (Clearbit/external) — both normalised to null if empty
  const cleanStorageUrl = storageUrl?.trim() || null;
  const cleanUrl = url?.trim() || null;
  const primaryUrl = cleanStorageUrl ?? cleanUrl;

  // Derive the initial state from the module-level cache so we never
  // cause a re-render for URLs we already know the result of.
  const cached = primaryUrl ? logoResultCache.get(primaryUrl) : undefined;

  const [imgSrc, setImgSrc] = useState<string | null>(() => {
    if (!primaryUrl || cached === "error") return null;
    return primaryUrl;
  });

  const [failed, setFailed] = useState<boolean>(() => {
    return !primaryUrl || cached === "error";
  });

  // Track whether the component is still mounted before applying state updates
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // When the url props change (e.g., after a live DB update), re-evaluate
  useEffect(() => {
    if (!primaryUrl) {
      setFailed(true);
      setImgSrc(null);
      return;
    }

    const known = logoResultCache.get(primaryUrl);
    if (known === "success") {
      setImgSrc(primaryUrl);
      setFailed(false);
      return;
    }
    if (known === "error") {
      setImgSrc(null);
      setFailed(true);
      return;
    }

    // First time we've seen this URL — show it and let onLoad/onError decide
    setImgSrc(primaryUrl);
    setFailed(false);
  }, [primaryUrl]);

  const handleLoad = () => {
    if (!mountedRef.current || !primaryUrl) return;
    logoResultCache.set(primaryUrl, "success");
    setFailed(false);
  };

  const handleError = () => {
    if (!mountedRef.current || !primaryUrl) return;

    // Strategy 1: if the stored URL is a Clearbit URL (or any direct image that
    // just failed), try the Google Favicon API as a reliable fallback.
    // Only attempt favicon fallback if we haven't already tried it (imgSrc differs from primaryUrl).
    const domain = domainFromLogoUrl(primaryUrl);
    const fallbackSrc = domain ? googleFaviconUrl(`https://${domain}`) : null;

    if (fallbackSrc && imgSrc !== fallbackSrc) {
      // Attempt the Google favicon fallback — do NOT add to logoResultCache yet
      setImgSrc(fallbackSrc);
      return;
    }

    // Strategy 2 (final): both primary URL and favicon fallback failed.
    // Permanently mark this URL as failed for this session.
    logoResultCache.set(primaryUrl, "error");
    setImgSrc(null);
    setFailed(true);
  };

  // ── Fallback: initials or icon ─────────────────────────────────────────────
  if (failed || !imgSrc) {
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
        aria-label={name ? `${name} logo placeholder` : "Company logo placeholder"}
      >
        {initials || <Building2 className="h-1/2 w-1/2 opacity-50" />}
      </div>
    );
  }

  // ── Logo image ─────────────────────────────────────────────────────────────
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-white", className)}>
      <img
        key={imgSrc}
        src={imgSrc}
        alt={name ? `${name} logo` : "Company logo"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...({ fetchpriority: priority ? "high" : "low" } as any)}
        width="128"
        height="128"
        // Do NOT use crossOrigin="anonymous" — it triggers CORS preflight
        // on CDNs that don't set Access-Control-Allow-Origin, causing valid
        // images to be blocked by the browser and incorrectly blacklisted.
        onLoad={handleLoad}
        onError={handleError}
        className={cn("h-full w-full object-contain", className)}
      />
    </div>
  );
});
