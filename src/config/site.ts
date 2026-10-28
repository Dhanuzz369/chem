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
export const SITE_UPDATED = "2026-10-24";

type Env = Record<string, string | undefined>;

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(env: Env = process.env): string {
  const raw = env.SITE_URL?.trim();
  return (raw || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function isIndexingAllowed(env: Env = process.env): boolean {
  return env.ALLOW_INDEXING === "true";
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
