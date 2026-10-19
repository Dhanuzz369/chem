import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import sitemap from "../../src/app/sitemap";
import { getSiteUrl } from "../../src/config/site";

/** Every indexable route, read from the sitemap so new pages are covered automatically. */
const routes = sitemap().map((entry) => new URL(entry.url).pathname);
const NOT_FOUND = "/does-not-exist";
const SITE_URL = getSiteUrl();

/** Collects console errors and uncaught exceptions while a page loads. */
function watchErrors(page: Page, { allow404 = false } = {}) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // The 404 page's own document request is expected to fail with a 404 status.
    if (allow404 && /status of 404/.test(message.text())) return;
    errors.push(message.text());
  });
  return errors;
}

async function head(page: Page) {
  return page.evaluate(() => {
    const attr = (selector: string, name: string) => document.querySelector(selector)?.getAttribute(name) ?? null;
    return {
      title: document.title,
      description: attr('meta[name="description"]', "content"),
      canonical: attr('link[rel="canonical"]', "href"),
      robots: attr('meta[name="robots"]', "content"),
      ogUrl: attr('meta[property="og:url"]', "content"),
    };
  });
}

test("the sitemap lists the expected number of routes", () => {
  // 6 static pages, 19 products, 4 posts.
  expect(routes).toHaveLength(29);
  expect(new Set(routes).size).toBe(routes.length);
});

for (const route of routes) {
  test(`SEO and accessibility: ${route}`, async ({ page }) => {
    const errors = watchErrors(page);
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toHaveCount(1);

    const meta = await head(page);
    expect(meta.title.length).toBeGreaterThan(0);
    expect(meta.description?.length ?? 0).toBeGreaterThan(50);
    expect(meta.description!.length).toBeLessThanOrEqual(160);
    // Next.js writes the home canonical without its trailing slash.
    expect(meta.canonical).toBe(route === "/" ? SITE_URL : `${SITE_URL}${route}`);
    // Indexing is off in the test environment.
    expect(meta.robots).toMatch(/noindex/);
    if (meta.ogUrl) expect(meta.ogUrl).toBe(meta.canonical);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("titles and meta descriptions are unique across indexable pages", async ({ page }) => {
  const seen = { title: new Map<string, string>(), description: new Map<string, string>() };
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const meta = await head(page);
    for (const key of ["title", "description"] as const) {
      const value = meta[key] ?? "";
      expect(seen[key].get(value), `${key} of ${route} repeats`).toBeUndefined();
      seen[key].set(value, route);
    }
  }
});

test("the 404 page has one h1, noindex, no canonical and no accessibility issues", async ({ page }) => {
  const errors = watchErrors(page, { allow404: true });
  const response = await page.goto(NOT_FOUND);
  expect(response?.status()).toBe(404);
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toHaveCount(1);
  const meta = await head(page);
  expect(meta.robots).toMatch(/noindex/);
  expect(meta.canonical).toBeNull();
  expect(meta.ogUrl).toBeNull();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  expect(errors).toEqual([]);
});
