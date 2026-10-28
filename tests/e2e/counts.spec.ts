import { expect, type Locator, test } from "./fixtures";
import { productGroups, products } from "../../src/content/products";

// The owner asked for no product totals or per-group counts in the copy.
const total = new RegExp(`\\b(${products.length}|19)\\b`);
const groupCount = new RegExp(`\\b\\d+\\s+(products?|chemicals?)\\b|\\b(${productGroups.join("|")})\\s*\\d+\\b`, "i");

async function expectNoCounts(locator: Locator) {
  const text = await locator.innerText();
  expect(text).not.toMatch(total);
  expect(text).not.toMatch(groupCount);
}

test("home hero has no product counts", async ({ page }) => {
  await page.goto("/");
  await expectNoCounts(page.getByRole("region", { name: /industrial chemicals/i }));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Industrial chemicals, listed by HSN code");
});

test("/products intro and unfiltered finder show no counts", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("searchbox", { name: "Search products" })).toBeEnabled();
  await expectNoCounts(page.locator("h1 + p"));
  await expect(page.getByRole("status")).toHaveText("Showing all products.");
});

test("/about has no product counts", async ({ page }) => {
  await page.goto("/about");
  await expectNoCounts(page.getByRole("main"));
});

test("404 group links have no counts", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expectNoCounts(page.getByRole("region", { name: "Or start from a product group" }));
});

test("meta descriptions have no product totals", async ({ page }) => {
  for (const path of ["/", "/products", "/about"]) {
    await page.goto(path);
    expect(await page.locator('meta[name="description"]').getAttribute("content"), path).not.toMatch(total);
  }
});
