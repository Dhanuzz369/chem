import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

const GOOGLE = /googletagmanager\.com|google-analytics\.com/;

function googleRequests(page: Page) {
  const seen: string[] = [];
  page.on("request", (req) => GOOGLE.test(req.url()) && seen.push(req.url()));
  return seen;
}

const banner = (page: Page) => page.getByRole("region", { name: "Cookie settings" });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("goodbiz-consent") ?? "null"));

test.describe("in an ask-first time zone", () => {
  test.use({ timezoneId: "Europe/Berlin" });

  test("the banner asks first, pre-selects nothing and nothing loads from Google", async ({ page }) => {
    const google = googleRequests(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    for (const name of ["Accept", "Reject"]) {
      await expect(banner(page).getByRole("button", { name })).not.toHaveAttribute("aria-pressed");
    }
    await expect(banner(page).getByRole("link", { name: /privacy/i })).toHaveAttribute("href", "/privacy");
    expect((await new AxeBuilder({ page }).include("[data-consent-banner]").analyze()).violations).toEqual([]);
    await page.waitForTimeout(2000);
    expect(google).toEqual([]);
    expect((await page.context().cookies()).filter((c) => c.name.startsWith("_ga"))).toEqual([]);
  });

  test("Reject is remembered and the banner stays away", async ({ page }) => {
    await page.goto("/");
    await banner(page).getByRole("button", { name: "Reject" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await stored(page)).toMatchObject({ v: 1, analytics: "denied" });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toBeHidden();
  });

  test("the page stays usable: the footer scrolls clear of the banner", async ({ page }) => {
    await page.goto("/quote");
    await expect(banner(page)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footerEnd = await page.getByRole("button", { name: "Cookie settings" }).boundingBox();
    const bannerTop = await banner(page).boundingBox();
    expect(footerEnd!.y + footerEnd!.height).toBeLessThanOrEqual(bannerTop!.y + 1);
  });
});

test.describe("where analytics is on by default", () => {
  test("no banner; Cookie settings shows the choice in effect and Reject stores denied", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(banner(page)).toBeHidden();

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText("Analytics is on by default where you are.");
    await expect(banner(page).getByRole("button", { name: "Accept" })).toHaveAttribute("aria-pressed", "true");
    await expect(banner(page).getByRole("button", { name: "Reject" })).toHaveAttribute("aria-pressed", "false");

    await banner(page).getByRole("button", { name: "Reject" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await stored(page)).toMatchObject({ v: 1, analytics: "denied" });

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(banner(page).getByRole("button", { name: "Reject" })).toHaveAttribute("aria-pressed", "true");
  });

  test("away from the live host nothing loads from Google", async ({ page }) => {
    const google = googleRequests(page);
    await page.goto("/");
    await page.waitForTimeout(2000);
    expect(google).toEqual([]);
  });
});
