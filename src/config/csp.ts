import { leadsEndpoint } from "../lib/leads/send";

type Env = Record<string, string | undefined>;

/**
 * Apps Script answers a POST to script.google.com with a redirect to this host, so both the
 * fetch (connect-src) and the no-JavaScript form post (form-action) must be allowed to reach it.
 */
const APPS_SCRIPT_CONTENT_ORIGIN = "https://script.googleusercontent.com";

/** The origins the quote form sends to: the endpoint's own and, for Apps Script, its redirect target. */
export function leadOrigins(raw: string | undefined): string[] {
  const endpoint = leadsEndpoint(raw);
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    // Empty, or a same-site path such as the e2e stub: 'self' already covers it.
    return [];
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return [];
  return url.hostname === "script.google.com" ? [url.origin, APPS_SCRIPT_CONTENT_ORIGIN] : [url.origin];
}

/**
 * The Content-Security-Policy header. Pages are prerendered, so there is no per-request nonce and
 * inline scripts stay allowed (Next's "without nonces" setup); the policy still stops scripts,
 * styles, frames and form posts from any other site.
 */
export function contentSecurityPolicy(env: Env = process.env): string {
  const leads = leadOrigins(env.NEXT_PUBLIC_LEADS_ENDPOINT);
  const dev = env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // React rebuilds server error stacks with eval in development only.
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    ["connect-src 'self'", ...leads].join(" "),
    ["form-action 'self'", ...leads].join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
