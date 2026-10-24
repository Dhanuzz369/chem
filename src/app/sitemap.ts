import type { MetadataRoute } from "next";
import { SITE_UPDATED, absoluteUrl } from "@/config/site";
import { products } from "@/content/products";
import { getAllPosts } from "@/lib/blog";
import { postOgImagePath, productOgImagePath } from "@/lib/seo/metadata";

/** The still frame of the home page's 3D hero; Google reads its context from the page. */
export const HERO_IMAGE = "/hero-fallback.webp";

const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.7, changeFrequency: "yearly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: SITE_UPDATED,
      changeFrequency,
      priority,
      ...(path === "/" && { images: [absoluteUrl(HERO_IMAGE)] }),
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [absoluteUrl(productOgImagePath(p.slug))],
    })),
    ...getAllPosts().map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: [absoluteUrl(postOgImagePath(post.slug))],
    })),
  ];
}
