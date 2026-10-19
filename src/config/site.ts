export type Contact = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
};

export const site: { name: "Goodbiz Chem"; tagline: string; contact: Contact } = {
  name: "Goodbiz Chem",
  tagline: "Industrial and specialty chemicals, exported worldwide.",
  // Real contact details are supplied by the client; none are invented here.
  contact: {},
};

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
