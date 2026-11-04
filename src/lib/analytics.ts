/** The Google Analytics 4 web stream. Public by design: it appears in every page's HTML. */
export const GA_MEASUREMENT_ID = "G-4WJVCQDVY1";

/** Only the live site reports to Analytics, so local runs, tests and Preview deploys don't skew the numbers. */
export function isAnalyticsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV === "production";
}

type Gtag = (command: "event", name: string, params?: Record<string, string | number>) => void;

/**
 * Sends a GA4 event when the tag has loaded, and does nothing otherwise (Analytics off, blocked by
 * the visitor, or not loaded yet). Never pass names, emails or phone numbers: Google forbids
 * personal data in Analytics.
 */
export function trackEvent(name: string, params?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}
