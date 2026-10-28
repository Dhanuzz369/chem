import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";
import { getAllPosts } from "../../src/lib/blog";

const post = "/blog/sles-70-vs-sles-28";

test("index lists posts", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const items = page.getByRole("list", { name: "Posts" }).getByRole("listitem");
  await expect(items).toHaveCount(getAllPosts().length);
  await expect(items.first().getByRole("link")).toHaveAttribute("href", /^\/blog\/[a-z0-9-]+$/);
});

test("post renders with BlogPosting JSON-LD and links to its products", async ({ page }) => {
  await page.goto(post);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SLES");
  const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(blocks).toContain('"@type":"BlogPosting"');
  expect(blocks).toContain('"BreadcrumbList"');

  const products = page.getByRole("region", { name: "Products in this article" });
  await expect(products.getByRole("link", { name: /SLES 70%/ })).toHaveAttribute("href", "/products/sles-70");
  await expect(products.getByRole("link", { name: /SLES 28%/ })).toHaveAttribute("href", "/products/sles-28");
  await expect(page.getByRole("article").locator('a[href="/products/sles-70"]').first()).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Request a quote" }).last()).toHaveAttribute("href", "/quote");
});

test("unknown post 404s", async ({ page }) => {
  const res = await page.goto(`/blog/nope-${Date.now()}`);
  expect(res?.status()).toBe(404);
});

const slugs = [
  "hsn-codes-for-chemical-exports",
  "sles-70-vs-sles-28",
  "choosing-an-industrial-solvent",
  "labsa-in-detergent-manufacturing",
];

test("sitemap includes posts", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const slug of slugs) {
    expect(xml).toContain(`/blog/${slug}</loc>`);
  }
});

for (const path of ["/blog", ...slugs.map((slug) => `/blog/${slug}`)]) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
