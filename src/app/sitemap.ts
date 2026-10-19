import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { products } from "@/content/products";
import { getAllPosts } from "@/lib/blog";

const staticRoutes = ["/", "/products", "/quote", "/blog", "/about", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getAllPosts().map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
