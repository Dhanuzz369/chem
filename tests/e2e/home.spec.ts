import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const fallback = 'img[src*="hero-fallback"]';

test("h1 and quote CTA usable before 3D", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const cta = page.getByRole("main").getByRole("link", { name: "Request a quote" }).first();
  await expect(cta).toBeVisible();
  // The CTA works whether or not the scene has loaded yet.
  await cta.click();
  await expect(page).toHaveURL(/\/quote$/);
});

test("reduced motion shows static hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(fallback)).toBeVisible();
  // Give the idle callback time to run; the scene must still stay away.
  await page.waitForTimeout(1500);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(fallback)).toBeVisible();
});

test("canvas mounts with motion allowed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop only");
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 5000 });
});

test("home sections present", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");

  const range = main.getByRole("region", { name: "Product range" });
  await expect(range).toBeVisible();
  await expect(range.getByRole("list", { name: "Products" }).getByRole("listitem")).toHaveCount(19);

  const ordering = main.getByRole("region", { name: "How ordering and export work" });
  await expect(ordering).toBeVisible();
  await expect(ordering.getByRole("listitem")).toHaveCount(4);

  const faq = main.getByRole("region", { name: "Frequently asked questions" });
  await expect(faq).toBeVisible();

  const latest = main.getByRole("region", { name: "Latest from the blog" });
  await expect(latest).toBeVisible();
  const postLinks = latest.getByRole("list", { name: "Latest posts" }).getByRole("listitem").getByRole("link");
  await expect(postLinks).toHaveCount(3);
  for (const link of await postLinks.all()) await expect(link).toHaveAttribute("href", /^\/blog\/[a-z0-9-]+$/);
  await expect(latest.getByRole("link", { name: "All posts" })).toHaveAttribute("href", "/blog");

  const closing = main.getByRole("region", { name: "Ask for a quote" });
  await expect(closing).toBeVisible();
  await expect(closing.getByRole("link", { name: "Request a quote" })).toHaveAttribute("href", "/quote");
});

test("home JSON-LD", async ({ page }) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = blocks
    .flatMap((text) => {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    })
    .map((item) => item["@type"]);
  expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "FAQPage"]));
});

test("no axe violations on /", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("searchbox", { name: "Search products" })).toBeEnabled();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
