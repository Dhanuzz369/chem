import type { Metadata } from "next";
import { absoluteUrl, isIndexingAllowed, site } from "@/config/site";
import type { Product } from "@/content/products";
import type { PostMeta } from "@/lib/blog";
import { FEED_ALTERNATE } from "@/lib/seo/rss";

export const DEFAULT_OG_IMAGE = "/og-default.png";

/** Search engines show about 60 characters of a title; " | Goodbiz Chem" is part of that. */
const MAX_TITLE = 60;
const TITLE_SUFFIX = ` | ${site.name}`;
const MAX_KEYWORDS = 15;

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  /** Use the title as given, without the layout's " | Goodbiz Chem" template (it already names the brand). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
};

/** Page metadata with canonical, Open Graph, Twitter and robots derived from env at call time. */
export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt = site.name,
  keywords,
  absoluteTitle = false,
  type = "website",
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const index = isIndexingAllowed();
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords && keywords.length > 0 && { keywords }),
    alternates: { canonical: url, types: FEED_ALTERNATE },
    robots: { index, follow: index },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type,
      locale: "en",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}

/** Search-console and Bing ownership tags, each only when its env var is set. */
export function verificationMetadata(env: Record<string, string | undefined> = process.env): Metadata["verification"] {
  const google = env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google && { google }),
    ...(bing && { other: { "msvalidate.01": bing } }),
  };
}

/**
 * "<Name> Exporter & Supplier, HSN <code>", or the shorter "<Name> Exporter, HSN <code>" when the
 * long form plus the brand passes 60 characters. Very long names set `seoTitle` instead.
 */
export function productTitle(p: Pick<Product, "name" | "hsn" | "seoTitle">): string {
  if (p.seoTitle) return p.seoTitle;
  const long = `${p.name} Exporter & Supplier, HSN ${p.hsn}`;
  if (long.length + TITLE_SUFFIX.length <= MAX_TITLE) return long;
  return `${p.name} Exporter, HSN ${p.hsn}`;
}

/** HSN first and under 160 characters, so search snippets show the code buyers search for. */
export function productMetaDescription(p: Pick<Product, "name" | "hsn" | "metaSummary">): string {
  return `${p.name} (HSN ${p.hsn}) — ${p.metaSummary}. Exporter from ${site.origin.country}. SDS available on request.`;
}

/**
 * The plain chemical name for keyword phrases: the longest part of a compound name, so
 * "DCM / Methylene Chloride" gives "Methylene Chloride" and "Caustic Soda (solid)" gives "Caustic Soda".
 */
function plainName(name: string): string {
  const parts = name.split(/\s*[/()]\s*/).filter(Boolean);
  return parts.reduce((longest, part) => (part.length > longest.length ? part : longest), parts[0] ?? name);
}

/** Case-insensitive de-duplication that keeps the first spelling and the order. */
function uniqueKeywords(list: string[], max = MAX_KEYWORDS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const k = raw.trim();
    if (!k || seen.has(k.toLowerCase())) continue;
    seen.add(k.toLowerCase());
    out.push(k);
  }
  return out.slice(0, max);
}

/** Buyer search phrases built only from the product's own data, most important first. */
export function productKeywords(p: Pick<Product, "name" | "hsn" | "cas" | "synonyms">): string[] {
  const name = plainName(p.name);
  const country = site.origin.country;
  return uniqueKeywords([
    p.name,
    name,
    `${name} exporter`,
    `${name} supplier`,
    `${name} exporter ${country}`,
    `${name} HSN code`,
    `HSN ${p.hsn}`,
    ...p.cas,
    `${name} bulk`,
    ...p.synonyms,
  ]);
}

/** Keywords for a post: the products it covers, each with its HSN code. */
export function postKeywords(post: Pick<PostMeta, "products">, products: Pick<Product, "slug" | "name" | "hsn">[]): string[] {
  const covered = post.products
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is Pick<Product, "slug" | "name" | "hsn"> => Boolean(p));
  return uniqueKeywords([...covered.map((p) => plainName(p.name)), ...covered.map((p) => `HSN ${p.hsn}`)]);
}

/** Keyword list for site-level pages (home, catalogue, blog index) from the groups and product names. */
export function catalogueKeywords(groups: string[], products: Pick<Product, "name">[]): string[] {
  const country = site.origin.country;
  return uniqueKeywords([
    "industrial chemicals exporter",
    `chemical exporter ${country}`,
    "industrial chemicals supplier",
    "chemicals by HSN code",
    ...groups.map((g) => `${g.toLowerCase()} exporter`),
    ...products.map((p) => plainName(p.name)),
  ]);
}

export function postTitle(post: Pick<PostMeta, "title" | "seoTitle">): string {
  return post.seoTitle ?? post.title;
}

/** The generated share card for a product (src/app/products/[slug]/opengraph-image.tsx, id "card"). */
export function productOgImagePath(slug: string): string {
  return `/products/${slug}/opengraph-image/card`;
}

export function productOgImageAlt(p: Pick<Product, "name" | "hsn">): string {
  return `${p.name} (HSN ${p.hsn}) | ${site.name}`;
}

/** The generated share card for a post (src/app/blog/[slug]/opengraph-image.tsx, id "card"). */
export function postOgImagePath(slug: string): string {
  return `/blog/${slug}/opengraph-image/card`;
}
