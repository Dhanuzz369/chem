import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllPosts, getPost, renderMarkdown, toIsoDate } from "@/lib/blog";
import { getProduct } from "@/content/products";
import { bannedClaims } from "../helpers/claims";

function words(html: string) {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

describe("blog", () => {
  it("loads every post file, newest first", () => {
    const files = fs.readdirSync(path.join(process.cwd(), "content", "blog")).filter((f) => f.endsWith(".md"));
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts).toHaveLength(files.length);
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    const today = new Date().toISOString().slice(0, 10);
    for (const d of dates) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d <= today, `${d} is in the future`).toBe(true);
    }
  });

  it("every post links only real products", () => {
    for (const post of getAllPosts()) {
      expect(post.products.length, post.slug).toBeGreaterThan(0);
      for (const slug of post.products) expect(getProduct(slug), `${post.slug} -> ${slug}`).toBeDefined();
      const html = getPost(post.slug)!.html;
      for (const [, slug] of html.matchAll(/href="\/products\/([^"#?]+)"/g)) {
        expect(getProduct(slug), `${post.slug} body -> ${slug}`).toBeDefined();
      }
    }
  });

  it("every post has a description of 70–160 characters", () => {
    for (const post of getAllPosts()) {
      expect(post.description.length, post.slug).toBeGreaterThanOrEqual(70);
      expect(post.description.length, post.slug).toBeLessThanOrEqual(160);
    }
  });

  it("no invented claims", () => {
    for (const post of getAllPosts()) {
      const full = getPost(post.slug)!;
      for (const t of [full.title, full.description, full.html]) expect(t, post.slug).not.toMatch(bannedClaims);
    }
  });

  it("posts are 700–1200 words with question-style h2s", () => {
    for (const meta of getAllPosts()) {
      const post = getPost(meta.slug)!;
      const n = words(post.html);
      expect(n, meta.slug).toBeGreaterThanOrEqual(700);
      expect(n, meta.slug).toBeLessThanOrEqual(1200);
      expect(post.readingMinutes).toBe(Math.max(1, Math.round(n / 200)));
      const h2s = [...post.html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((m) => m[1]);
      expect(h2s.length, meta.slug).toBeGreaterThanOrEqual(3);
      expect(h2s.filter((h) => h.endsWith("?")).length, meta.slug).toBeGreaterThanOrEqual(3);
      // Answer first: the body opens with a paragraph, not a heading.
      expect(post.html.trimStart().startsWith("<p>"), meta.slug).toBe(true);
    }
  });

  it("escapes raw HTML in markdown", () => {
    const html = renderMarkdown('Text <span onclick="x()">hi</span>\n\n<script>alert(1)</script>');
    expect(html).not.toMatch(/<script|<span/);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;span");
  });

  it("wraps tables in a focusable scroll region named after the column headings", () => {
    const html = renderMarkdown("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(html).toMatch(/^<div class="table-scroll" role="region" aria-label="Table: a, b" tabindex="0"><table>/);
  });

  it("accepts real dates and rejects impossible ones", () => {
    expect(toIsoDate("2026-10-05")).toBe("2026-10-05");
    expect(toIsoDate(new Date("2024-02-29T00:00:00Z"))).toBe("2024-02-29");
    expect(() => toIsoDate("2026-13-45")).toThrow(/Invalid post date/);
    expect(() => toIsoDate("2026-02-30")).toThrow(/Invalid post date/);
    expect(() => toIsoDate("5 Oct 2026")).toThrow(/Invalid post date/);
  });

  it("returns null for an unknown slug", () => {
    expect(getPost("nope")).toBeNull();
    expect(getPost("../package")).toBeNull();
  });
});
