import { absoluteUrl, site } from "@/config/site";
import type { PostMeta } from "@/lib/blog";

export const FEED_PATH = "/blog/feed.xml";

/**
 * The <link rel="alternate"> for the feed. A page's own `alternates` replaces the layout's whole, so
 * every page that sets a canonical must repeat this to keep the link.
 */
export const FEED_ALTERNATE = { "application/rss+xml": [{ url: FEED_PATH, title: `${site.name} blog` }] };

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS wants RFC 822 dates; a post's YYYY-MM-DD becomes midnight UTC that day. */
const rssDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toUTCString();

/** An RSS 2.0 feed of the blog, newest post first. */
export function blogFeed(posts: PostMeta[]): string {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const items = sorted.map((post) => {
    const url = absoluteUrl(`/blog/${post.slug}`);
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <pubDate>${rssDate(post.date)}</pubDate>`,
      `      <description>${escapeXml(post.description)}</description>`,
      "    </item>",
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${site.name} blog`)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/blog"))}</link>`,
    `    <atom:link href="${escapeXml(absoluteUrl(FEED_PATH))}" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeXml("Plain answers for buyers of industrial chemicals: HSN codes, grades, selection and uses.")}</description>`,
    "    <language>en</language>",
    ...(sorted[0] ? [`    <lastBuildDate>${rssDate(sorted[0].date)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
