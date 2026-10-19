import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const banned = /certified|ISO \d|since \d{4}|years of experience|REACH[- ]compliant|guarantee|leading|trusted|premier/i;

test("about renders without claims", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.getByRole("main").innerText()).not.toMatch(banned);
  await expect(page.getByRole("main").getByText("SDS available on request")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Request a quote" }).first()).toHaveAttribute("href", "/quote");
});

test("contact shows quote form and hides empty contact fields", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]')).toHaveCount(0);
});

test("404 page offers products and quote links", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page not found/);
  // Next adds its own noindex on 404s; every robots tag present must say noindex.
  const robots = await page.locator('meta[name="robots"]').evaluateAll((els) => els.map((el) => el.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  for (const content of robots) expect(content).toMatch(/noindex/);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Browse products" })).toHaveAttribute("href", "/products");
  await expect(main.getByRole("link", { name: "Request a quote" })).toHaveAttribute("href", "/quote");
  await expect(main.getByRole("link", { name: /Solvents/ })).toHaveAttribute("href", "/products?group=solvents");
});

test("unknown product slug shows the same 404", async ({ page }) => {
  const res = await page.goto("/products/not-a-product");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("main").getByRole("link", { name: "Browse products" })).toBeVisible();
});

for (const path of ["/about", "/contact", "/does-not-exist"]) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
