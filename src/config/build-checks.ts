/**
 * Checks run once, when the site is built (see next.config.ts). They use
 * relative imports only, because next.config.ts loads this file directly.
 */
import { getSiteUrl, isIndexingAllowed, type Contact } from "./site";

type Env = Record<string, string | undefined>;

/** Search engines must never be let in while every link still points at localhost. */
export function assertSiteUrlForIndexing(env: Env): void {
  if (isIndexingAllowed(env) && /^https?:\/\/localhost\b/.test(getSiteUrl(env))) {
    throw new Error(
      "Indexing is on but SITE_URL is empty, so every link would point at localhost. Set SITE_URL to the live " +
        "address (for example https://www.example.com) and build again, or leave ALLOW_INDEXING empty.",
    );
  }
}

/** A production build with no way to reach the company; the README's "Going live" step 0. */
export function missingContactWarning(env: Env, contact: Contact): string | undefined {
  if (env.VERCEL_ENV !== "production") return undefined;
  if (Object.values(contact).some((value) => value?.trim())) return undefined;
  return (
    "Warning: this production build has no contact details. Buyers will only see the quote form. " +
    "Fill in the contact block in src/config/site.ts (at least an email) before going live."
  );
}
