import { expect, test } from "@playwright/test";

// Owner change request 1: Goodbiz Chem also sources chemicals that are not listed.
const message = /source and supply/i;

test("home: sourcing block sits between the product range and ordering, with a CTA", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  const block = main.getByRole("region", { name: "Need a chemical that isn't listed?" });
  await expect(block).toBeVisible();
  await expect(block).toContainText(message);
  await expect(block.getByRole("link", { name: "Request a chemical not listed" })).toHaveAttribute("href", "/quote#other");

  const ids = await main.locator("section[aria-labelledby]").evaluateAll((els) => els.map((el) => el.getAttribute("aria-labelledby")));
  const at = (id: string) => ids.indexOf(id);
  expect(at("sourcing-title")).toBeGreaterThan(at("product-range-title"));
  expect(at("sourcing-title")).toBeLessThan(at("ordering-title"));

  await expect(main.getByRole("heading", { name: "Can you supply a chemical that isn't on your list?" })).toBeVisible();
});

test("/products: callout below the finder links to the other-chemical field", async ({ page }) => {
  await page.goto("/products");
  const callout = page.getByRole("region", { name: "Need a chemical that isn't listed?" });
  await expect(callout).toContainText(message);
  await expect(callout.getByRole("link", { name: "Request a chemical not listed" })).toHaveAttribute("href", "/quote#other");
});

test("/products: the no-match state offers sourcing", async ({ page }) => {
  await page.goto("/products");
  const search = page.getByRole("searchbox", { name: "Search products" });
  await expect(search).toBeEnabled();
  await search.fill("zzzz");
  await expect(page.getByText(/we.ll source and supply it/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask us to source it" })).toHaveAttribute("href", "/quote#other");
});

test("product page: one line offers chemicals not listed", async ({ page }) => {
  await page.goto("/products/methanol");
  const link = page.getByRole("link", { name: "We also source chemicals not listed here" });
  await expect(link).toHaveAttribute("href", "/quote#other");
});

test("about: what we supply mentions sourcing", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("region", { name: "What we supply" })).toContainText(message);
});
