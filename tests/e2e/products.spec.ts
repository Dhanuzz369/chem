import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { products } from "../../src/content/products";

const cards = (page: Page) => page.getByRole("list", { name: "Products" }).getByRole("listitem");

/** The finder is a client component; wait until it is hydrated before interacting. */
async function openFinder(page: Page, url = "/products") {
  await page.goto(url);
  await expect(page.getByRole("searchbox", { name: "Search products" })).toBeEnabled();
}

test("index lists every product", async ({ page }) => {
  await openFinder(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(cards(page)).toHaveCount(products.length);
});

test("filter and search", async ({ page }) => {
  await openFinder(page);
  await page.getByRole("button", { name: "Surfactants" }).click();
  await expect(page.getByRole("button", { name: "Surfactants" })).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(8);
  await expect(page).toHaveURL(/[?&]group=surfactants/);

  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search products" }).fill("3402");
  await expect(cards(page)).toHaveCount(8);
  await expect(page.getByRole("status")).toContainText("8 products");
});

test("group query param preselects the chip", async ({ page }) => {
  await openFinder(page, "/products?group=Solvents");
  await expect(page.getByRole("button", { name: "Solvents" })).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(6);
});

test("search with no match offers a way out", async ({ page }) => {
  await openFinder(page);
  await page.getByRole("searchbox", { name: "Search products" }).fill("zzzz");
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ask for a product we don't list" })).toBeVisible();
});

test("both SLES pages render", async ({ page }) => {
  await page.goto("/products/sles-70");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SLES 70%");
  await expect(page.getByText("340239").first()).toBeVisible();

  await page.goto("/products/sles-28");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SLES 28%");
  await expect(page.getByText("340239").first()).toBeVisible();
});

test("product page has answer-first summary, HSN, SDS note, FAQ, related links and prefilled form", async ({ page }) => {
  await page.goto("/products/methanol");
  await expect(page).toHaveTitle("Methanol (HSN 29051100) Exporter | Goodbiz Chem");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Methanol");

  const summary = page.locator("h1 + p");
  await expect(summary).toContainText("Methanol is the simplest alcohol");

  const facts = page.getByRole("region", { name: "Key facts" });
  await expect(facts.getByText("29051100")).toBeVisible();
  await expect(facts.getByText("67-56-1")).toBeVisible();
  await expect(facts.getByText("Solvents")).toBeVisible();

  const safety = page.getByRole("region", { name: "Handling, storage and hazards" });
  await expect(safety.getByText("SDS available on request")).toBeVisible();
  await expect(safety.getByText("Causes damage to organs, notably the optic nerve; small amounts swallowed can cause blindness or death.")).toBeVisible();

  const faq = page.getByRole("heading", { name: "What HSN code does methanol use?" });
  await expect(faq).toBeVisible();
  await faq.click();
  await expect(page.getByText("Methanol (methyl alcohol) is classified under HSN 29051100.")).toBeVisible();

  const related = page.getByRole("region", { name: "Related products" });
  await expect(related.getByRole("link", { name: /Ethyl Acetate/ })).toHaveAttribute("href", "/products/ethyl-acetate");

  await expect(page.getByRole("button", { name: "Remove Methanol" })).toBeVisible();
});

test("mobile shows a sticky quote bar", async ({ page }, testInfo) => {
  await page.goto("/products/methanol");
  const bar = page.getByRole("link", { name: "Request a quote for Methanol" });
  if (testInfo.project.name === "mobile") {
    await page.mouse.wheel(0, 1500);
    await expect(bar).toBeInViewport();
  } else {
    await expect(bar).toBeHidden();
  }
});

test("notes render on products that have them", async ({ page }) => {
  await page.goto("/products/nonylphenol-ethoxylates");
  await expect(page.getByText("NPE and nonylphenol are restricted in some markets", { exact: false })).toBeVisible();
});

test("product JSON-LD present", async ({ page }) => {
  await page.goto("/products/methanol");
  const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("\n");
  expect(blocks).toContain('"@type":"Product"');
  expect(blocks).toContain('"FAQPage"');
  expect(blocks).toContain('"BreadcrumbList"');
});

test("unknown slug 404s", async ({ page }) => {
  // A fresh slug each run: the first request for an unlisted path is the one that must 404.
  const res = await page.goto(`/products/nope-${Date.now()}`);
  expect(res?.status()).toBe(404);
});

for (const path of ["/products", "/products/methanol"]) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
