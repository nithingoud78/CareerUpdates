/**
 * analytics-tracking.ts
 * Client-side analytics utilities for Career Updates.
 * Privacy-first: anonymous UUIDs only, no PII, no IP, no fingerprinting.
 * Visitor ID persists across sessions (localStorage).
 * Session ID expires when tab closes (sessionStorage).
 */

import { recordAnalyticsEvent } from "./analytics.functions";

export type AnalyticsEventType =
  | "page_view"
  | "job_view"
  | "blog_view"
  | "search"
  | "apply_click"
  | "company_view"
  | "category_view";

export interface AnalyticsPayload {
  event_type: AnalyticsEventType;
  path: string;
  job_id?: string;
  blog_id?: string;
  search_query?: string;
}

const VISITOR_KEY = "cu_vid";
const SESSION_KEY = "cu_sid";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.screen?.width ?? window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const url = new URL(document.referrer);
    return url.hostname.slice(0, 200) || undefined;
  } catch {
    return undefined;
  }
}

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if ((navigator as any).webdriver === true) return true;
  return false;
}

export function track(payload: AnalyticsPayload): void {
  if (shouldSkip()) return;

  const fire = () => {
    try {
      recordAnalyticsEvent({
        data: {
          ...payload,
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          referrer: getReferrer(),
          device_type: getDeviceType(),
        },
      }).catch(() => undefined);
    } catch {
      // Silently swallow
    }
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(fire, { timeout: 2000 });
  } else {
    setTimeout(fire, 0);
  }
}