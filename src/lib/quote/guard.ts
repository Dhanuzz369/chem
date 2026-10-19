import type { QuoteInput } from "./schema";

const MIN_FILL_MS = 3000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** True when the honeypot is filled or the form was submitted implausibly fast. */
export function isSpam(input: Pick<QuoteInput, "website" | "startedAt">, now: number): boolean {
  if (input.website) return true;
  if (typeof input.startedAt !== "number") {
    console.warn("quote dropped: missing startedAt");
    return true;
  }
  return now - input.startedAt < MIN_FILL_MS;
}

const MAX_KEYS = 5000;
const hits = new Map<string, number[]>();

/** Test-only: number of keys currently tracked. */
export function rateLimitSize(): number {
  return hits.size;
}

/** In-memory, per-instance and best-effort. Returns true when the request is allowed. */
export function rateLimit(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  if (!hits.has(key) && hits.size >= MAX_KEYS) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    if (hits.size >= MAX_KEYS) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/**
 * Rate-limit identity. x-forwarded-for's left-most entry is client-controlled,
 * so prefer platform headers and otherwise take the right-most (proxy-appended) entry.
 */
export function clientKey(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = headers.get("x-forwarded-for")?.split(",").pop()?.trim();
  return xff || "unknown";
}
