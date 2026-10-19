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

const hits = new Map<string, number[]>();

/** In-memory, per-instance and best-effort. Returns true when the request is allowed. */
export function rateLimit(key: string, now: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}
