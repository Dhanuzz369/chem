import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "./fixtures";
import { products, searchProducts } from "../../src/content/products";

const inGroup = (group: string) => products.filter((p) => p.group === group).length;
const matches = (query: string) => searchProducts(query).length;

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
  await expect(cards(page)).toHaveCount(inGroup("Surfactants"));
  await expect(page).toHaveURL(/[?&]group=surfactants/);

  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search products" }).fill("3402");
  await expect(cards(page)).toHaveCount(matches("3402"));
  await expect(page.getByRole("status")).toContainText(`${matches("3402")} products`);
});

test("group query param preselects the chip", async ({ page }) => {
  await openFinder(page, "/products?group=Solvents");
  await expect(page.getByRole("button", { name: "Solvents" })).toHaveAttribute("aria-pressed", "true");
  await expect(cards(page)).toHaveCount(inGroup("Solvents"));
});

test("?q= prefills the search (the WebSite SearchAction target)", async ({ page }) => {
  await openFinder(page, "/products?q=sles");
  await expect(page.getByRole("searchbox", { name: "Search products" })).toHaveValue("sles");
  await expect(cards(page)).toHaveCount(matches("sles"));
  await expect(cards(page).filter({ hasText: "SLES 70%" })).toHaveCount(1);
  await expect(cards(page).filter({ hasText: "SLES 28%" })).toHaveCount(1);
  await expect(cards(page).filter({ hasText: "Methanol" })).toHaveCount(0);

  // Editing the box keeps what the buyer types and drops the stale ?q= from the address bar.
  const box = page.getByRole("searchbox", { name: "Search products" });
  await box.fill("sles 2");
  await expect(box).toHaveValue("sles 2");
  await expect(page).not.toHaveURL(/[?&]q=/);
});

test("product pages without a post have no Further reading section", async ({ page }) => {
  await page.goto("/products/diisopropylamine");
  await expect(page.getByRole("region", { name: "Further reading" })).toHaveCount(0);
});

test("search with no match offers a way out", async ({ page }) => {
  await openFinder(page);
  await page.getByRole("searchbox", { name: "Search products" }).fill("zzzz");
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ask us to source it" })).toHaveAttribute("href", "/quote#other");
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
  await expect(page).toHaveTitle("Methanol Exporter & Supplier, HSN 29051100 | Goodbiz Chem");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Methanol");

  // The subtitle sits with the h1 in an hgroup; the answer-first summary is the first paragraph after it.
  await expect(page.locator("hgroup > h1 + p")).toHaveText("Exporter & supplier·, HSN 29051100·, Solvents");
  const summary = page.locator("hgroup + p");
  await expect(summary).toContainText("Methanol is the simplest alcohol");

  const facts = page.getByRole("region", { name: "Key facts" });
  await expect(facts.getByText("29051100")).toBeVisible();
  await expect(facts.getByText("67-56-1")).toBeVisible();
  await expect(facts.getByText("Solvents")).toBeVisible();
  // The owner asked for no "Form" row; the field stays in the data but is never shown.
  await expect(facts.getByText("Form", { exact: true })).toHaveCount(0);
  await expect(facts.locator("dt")).toHaveText(["HSN code", "CAS number", "Group"]);

  const safety = page.getByRole("region", { name: "Handling, storage and hazards" });
  await expect(safety.getByText("SDS available on request")).toBeVisible();
  await expect(safety.getByText("Causes damage to organs, notably the optic nerve; small amounts swallowed can cause blindness or death.")).toBeVisible();

  const faq = page.getByRole("heading", { name: "What HSN code does methanol use?" });
  await expect(faq).toBeVisible();
  await faq.click();
  await expect(page.getByText("Methanol (methyl alcohol) is classified under HSN 29051100.")).toBeVisible();

  const exportQuestion = page.getByRole("heading", { name: "Do you export Methanol?" });
  await exportQuestion.click();
  await expect(page.getByText("Yes. Goodbiz Chem exports and supplies Methanol (HSN 29051100).", { exact: false })).toBeVisible();

  const reading = page.getByRole("region", { name: "Further reading" });
  await expect(reading.getByRole("link", { name: "How do you choose an industrial solvent?" })).toHaveAttribute(
    "href",
    "/blog/choosing-an-industrial-solvent",
  );

  const related = page.getByRole("region", { name: "Related products" });
  await expect(related.getByRole("link", { name: /Ethyl Acetate/ })).toHaveAttribute("href", "/products/ethyl-acetate");

  // The quote form already knows the product: five steps, starting with contact details.
  const quote = page.getByRole("region", { name: "Request a quote for Methanol" });
  await expect(quote.getByText("Step 1 of 5")).toBeVisible();
});

test("no product page shows its form description", async ({ page }) => {
  for (const p of products) {
    await page.goto(`/products/${p.slug}`);
    expect(await page.getByRole("main").innerText(), p.slug).not.toContain(p.form);
  }
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
  expect(blocks).toContain('"Do you export Methanol?"');
  expect(blocks).toContain('"subjectOf"');
});

test("product OG image is a 1200x630 PNG with a product-specific alt", async ({ page, request }) => {
  await page.goto("/products/methanol");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(new URL(og!).pathname).toBe("/products/methanol/opengraph-image/card");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "Methanol (HSN 29051100) | Goodbiz Chem");
  const res = await request.get("/products/methanol/opengraph-image/card");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const png = await res.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
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
