import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexingAllowed } from "@/config/site";

/**
 * Search and AI-assistant crawlers named explicitly, so the site stays quotable even where a
 * crawler's operator treats "*" conservatively. They get the same access as everyone else.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

// A crawler that matches a named group obeys only that group and ignores the "*" rules. Any future
// disallow (e.g. a private path) must be added to both groups below, or the named crawlers will skip it.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
