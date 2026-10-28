import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { site } from "../../src/config/site";
import { bannedPageClaims as banned } from "../helpers/claims";

test("about renders without claims", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle(`About Us: Chemical Exporter from ${site.origin.country} | ${site.name}`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    `${site.name} is a chemical exporter and supplier from ${site.origin.country}. See what we supply and how we work with buyers from enquiry to dispatch.`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.getByRole("main").innerText()).not.toMatch(banned);
  await expect(page.getByRole("main").getByText("SDS available on request")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Request a quote" }).first()).toHaveAttribute("href", "/quote");
});

test("about group tiles link to the filtered catalogue", async ({ page }) => {
  await page.goto("/about");
  const supply = page.getByRole("region", { name: "What we supply" });
  for (const group of ["Solvents", "Amines", "Inorganics", "Surfactants"]) {
    await expect(supply.getByRole("link", { name: group })).toHaveAttribute("href", `/products?group=${group.toLowerCase()}`);
  }
  await supply.getByRole("link", { name: "Amines" }).click();
  await expect(page).toHaveURL(/\/products\?group=amines$/);
  await expect(page.getByRole("button", { name: "Amines" })).toHaveAttribute("aria-pressed", "true");
});

test("contact shows the quote form and the owner's contact details", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  const details = page.getByRole("complementary", { name: "Contact details" });
  await expect(details.getByRole("link", { name: "chemicals@goodbizglobal.com" })).toHaveAttribute("href", "mailto:chemicals@goodbizglobal.com");
  await expect(details.locator('a[href="tel:+918884799369"]')).toHaveCount(1);
  await expect(details.locator('a[href="https://wa.me/918884799369"]')).toHaveCount(1);
  await expect(details.getByText("Bengaluru, Karnataka, India")).toBeVisible();
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
