import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, Renderer, type Tokens } from "marked";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** Product slugs from src/content/products.ts. */
  products: string[];
}

export interface Post extends PostMeta {
  html: string;
  readingMinutes: number;
}

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const SLUG = /^[a-z0-9-]+$/;
const WORDS_PER_MINUTE = 200;

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Posts are trusted local files, but raw HTML is still escaped rather than passed through,
 * so a stray tag in Markdown renders as text and only Markdown syntax produces markup.
 * Tables are wrapped so a wide one scrolls inside the article instead of widening the page.
 */
const markdown = new Marked({
  gfm: true,
  renderer: {
    html: ({ text }) => escapeHtml(text),
    table(token: Tokens.Table) {
      const table = Renderer.prototype.table.call(this, token);
      return `<div class="table-scroll" role="region" aria-label="Table" tabindex="0">${table}</div>\n`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return markdown.parse(source, { async: false });
}

function toIsoDate(value: unknown): string {
  // YAML parses an unquoted 2026-10-05 as a Date; quoted dates stay strings.
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Invalid post date: ${String(value)}`);
  return iso;
}

function readPost(slug: string): Post | null {
  if (!SLUG.test(slug)) return null;
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const { title, description, products } = data as Record<string, unknown>;
  if (typeof title !== "string" || typeof description !== "string") {
    throw new Error(`Post ${slug} needs a title and a description`);
  }
  if (!Array.isArray(products) || !products.every((p) => typeof p === "string")) {
    throw new Error(`Post ${slug} needs a products list`);
  }

  const html = renderMarkdown(content);
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title,
    description,
    date: toIsoDate(data.date),
    products,
    html,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

/** All posts, newest first. */
export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPost(f.slice(0, -3)))
    .filter((p): p is Post => p !== null)
    .map(({ slug, title, description, date, products }) => ({ slug, title, description, date, products }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | null {
  return readPost(slug);
}
