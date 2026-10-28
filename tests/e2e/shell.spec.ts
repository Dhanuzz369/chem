import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("header shows logo and quote CTA", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Goodbiz Chem" })).toBeVisible();
  const cta = header.getByRole("link", { name: "Request a quote" });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/quote");
});

test("mobile menu opens, traps focus, closes on Escape", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile only");
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toBeVisible();
  const box = await menuButton.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("navigation", { name: "Site" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Products" })).toBeVisible();

  // Focus cycles between the menu button and the menu links only.
  await menuButton.focus();
  const links = await menu.getByRole("link").count();
  for (let i = 0; i < links; i++) await page.keyboard.press("Tab");
  await expect(menu.getByRole("link").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menuButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("link").last()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toBeFocused();
});

test("mobile menu handles Escape and Tab even when focus has left the header", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile only");
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  await menuButton.click();
  const menu = page.getByRole("navigation", { name: "Site" });
  await expect(menu).toBeVisible();

  // Focus drifts to <body>, outside the header.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Tab");
  await expect(menuButton).toBeFocused();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
});

test("no axe violations on shell", async ({ page }, testInfo) => {
  await page.goto("/");
  const closed = await new AxeBuilder({ page }).analyze();
  expect(closed.violations).toEqual([]);

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Site" })).toBeVisible();
    // The menu fades in over 180ms; mid-fade text would read as low contrast.
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
    const open = await new AxeBuilder({ page }).analyze();
    expect(open.violations).toEqual([]);
  }
});

test("responses carry security headers and no X-Powered-By", async ({ request }) => {
  for (const path of ["/", "/llms.txt"]) {
    const headers = (await request.get(path)).headers();
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["permissions-policy"], path).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["x-powered-by"], path).toBeUndefined();
  }
});
