import { GA_MEASUREMENT_ID } from "./analytics";
import { CONSENT_REGIONS } from "./consent-regions";

export type Choice = "granted" | "denied";
/** What applies now: a stored choice, the banner (ask first), or analytics on by default with an opt-out. */
export type Mode = Choice | "ask" | "default";

export const CONSENT_KEY = "goodbiz-consent";
/** Analytics only ever runs here, never on Preview deploys, *.vercel.app or localhost. */
export const LIVE_HOST = "www.goodbizchemicals.com";
/** Footer "Cookie settings" fires this; the banner listens for it. */
export const COOKIE_SETTINGS_EVENT = "goodbiz:cookie-settings";

const GA_DISABLE = `ga-disable-${GA_MEASUREMENT_ID}`;
const ADS_DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" } as const;

/** A stored choice, or null when there is none, it is malformed, or it is 12 months old. */
export function parseChoice(raw: string | null, now = new Date()): Choice | null {
  try {
    const data = JSON.parse(raw ?? "") as { v?: unknown; analytics?: unknown; at?: unknown };
    if (data.v !== 1 || (data.analytics !== "granted" && data.analytics !== "denied")) return null;
    const expires = new Date(String(data.at));
    expires.setFullYear(expires.getFullYear() + 1);
    return expires > now ? data.analytics : null;
  } catch {
    return null;
  }
}

export function choiceInEffect(stored: Choice | null, askFirst: boolean): Mode {
  return stored ?? (askFirst ? "ask" : "default");
}

/** localStorage can be blocked (private modes, strict settings); then no choice is remembered. */
export function readChoice(): Choice | null {
  try {
    return parseChoice(window.localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

export function saveChoice(choice: Choice, now = new Date()): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, analytics: choice, at: now.toISOString() }));
  } catch {
    // Blocked storage: the choice still applies for this page view.
  }
}

/**
 * The `consent default` calls before gtag('js'). For a default visitor the first call denies analytics
 * for the ask-first countries, so Google keeps cookies off when their IP is in one of them, whatever
 * their time zone says; the second grants it everywhere else.
 */
export function consentDefaults(mode: "granted" | "default"): Record<string, unknown>[] {
  const granted = { ...ADS_DENIED, analytics_storage: "granted" };
  return mode === "granted" ? [granted] : [{ ...ADS_DENIED, analytics_storage: "denied", region: CONSENT_REGIONS }, granted];
}

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } & Record<string, unknown>;
const browserWindow = () => window as unknown as GtagWindow;

/** Defines gtag, sets consent defaults and config, then adds gtag.js. Once per page. */
export function loadGtag(mode: "granted" | "default", w = browserWindow()): void {
  if (w.gtag) return;
  w[GA_DISABLE] = false;
  w.dataLayer = w.dataLayer ?? [];
  // gtag.js reads the `arguments` object itself, not an array copy.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  for (const defaults of consentDefaults(mode)) w.gtag("consent", "default", defaults);
  w.gtag("js", new Date());
  w.gtag("config", GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = w.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  w.document.head.appendChild(script);
}

/** Accept: turn analytics on, loading the tag if this page has not loaded it yet. */
export function grantAnalytics(w = browserWindow()): void {
  w[GA_DISABLE] = false;
  if (w.gtag) w.gtag("consent", "update", { analytics_storage: "granted" });
  else if (w.location.hostname === LIVE_HOST) loadGtag("granted", w);
}

/** Reject: stop the tag sending anything and delete the cookies it set. */
export function denyAnalytics(w = browserWindow()): void {
  w[GA_DISABLE] = true;
  w.gtag?.("consent", "update", { analytics_storage: "denied" });
  for (const cookie of gaCookieDeletions(w.document.cookie, w.location.hostname)) w.document.cookie = cookie;
}

/** Cookie strings that delete _ga and every _ga_* on the host and on each parent domain. */
export function gaCookieDeletions(cookies: string, hostname: string): string[] {
  const names = cookies
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  const labels = hostname.split(".");
  // www.goodbizchemicals.com → the host itself, .goodbizchemicals.com and goodbizchemicals.com (never a bare TLD).
  const parents = labels.slice(1, -1).map((_, i) => labels.slice(i + 1).join("."));
  const domains = ["", ...[hostname, ...parents].flatMap((d) => [`; domain=.${d}`, `; domain=${d}`])];
  return names.flatMap((name) => domains.map((domain) => `${name}=; Max-Age=0; path=/${domain}`));
}
