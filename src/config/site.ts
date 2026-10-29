export type Contact = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
};

export type Origin = {
  /** Written into titles, descriptions, keywords and llms-full.txt as "exporter from <country>". */
  country: string;
  /** ISO 3166-1 alpha-2 code, used for the Organization address in structured data. */
  countryCode: string;
  /** City and state for the Organization address in structured data. No street address is published. */
  locality: string;
  region: string;
};

export const site: { name: "Goodbiz Chem"; tagline: string; contact: Contact; origin: Origin } = {
  name: "Goodbiz Chem",
  tagline: "Industrial and specialty chemicals, exported worldwide.",
  // Supplied by the owner on 2026-10-28. The footer, Contact page, quote-form fallback, JSON-LD and llms.txt read these.
  contact: {
    email: "chemicals@goodbizglobal.com",
    phone: "+91 8884799369",
    whatsapp: "+91 8884799369",
    address: "Bengaluru, Karnataka, India",
  },
  // Where the business exports from. This is the only place it is written; change it here.
  origin: { country: "India", countryCode: "IN", locality: "Bengaluru", region: "Karnataka" },
};

/** When the product data was last reviewed. Used as the sitemap's lastModified; bump it when products change. */
export const SITE_UPDATED = "2026-10-29";

type Env = Record<string, string | undefined>;

/** The live address. Production builds on Vercel use it unless SITE_URL says otherwise. */
export const PRODUCTION_SITE_URL = "https://www.goodbizchemicals.com";
const DEFAULT_SITE_URL = "http://localhost:3000";

const isProduction = (env: Env) => env.VERCEL_ENV === "production";

export function getSiteUrl(env: Env = process.env): string {
  const raw = env.SITE_URL?.trim();
  return (raw || (isProduction(env) ? PRODUCTION_SITE_URL : DEFAULT_SITE_URL)).replace(/\/+$/, "");
}

/**
 * Production on Vercel is open to search engines; previews and local builds are not.
 * ALLOW_INDEXING, when set, wins either way: "true" opens a build, anything else closes it.
 */
export function isIndexingAllowed(env: Env = process.env): boolean {
  const flag = env.ALLOW_INDEXING?.trim();
  return flag ? flag === "true" : isProduction(env);
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
