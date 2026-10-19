import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

type Stub = { status: number; body: Record<string, unknown> };

/** Stubs POST /api/quote and records every request body it receives. */
async function stubQuote(page: Page, stub: Stub) {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/quote", async (route) => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: stub.status, contentType: "application/json", body: JSON.stringify(stub.body) });
  });
  return bodies;
}

/** Opens the page and waits until the form is hydrated (the submit button enables only then). */
async function openQuote(page: Page, url = "/quote") {
  await page.goto(url);
  await expect(page.getByRole("button", { name: "Send quote request" })).toBeEnabled();
}

async function fillValid(page: Page) {
  await page.getByLabel("Name", { exact: true }).fill("Asha Rao");
  await page.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await page.getByLabel("Country", { exact: true }).fill("India");
  await page.getByLabel("Quantity", { exact: true }).fill("20");
}

test("prefills product from query", async ({ page }) => {
  await openQuote(page, "/quote?product=toluene");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
});

test("shows inline errors on empty submit", async ({ page }) => {
  await openQuote(page);
  await page.getByRole("button", { name: "Send quote request" }).click();

  for (const label of ["Name", "Email", "Country", "Products", "Quantity"]) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toHaveAttribute("aria-invalid", "true");
    const errorId = await field.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    await expect(page.locator(`[id="${errorId!.split(" ")[0]}"]`)).not.toBeEmpty();
  }
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
});

test("validates a field on blur and clears the error once fixed", async ({ page }) => {
  await openQuote(page);
  const email = page.getByLabel("Email", { exact: true });
  await email.fill("not-an-email");
  await email.blur();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await email.fill("asha@example.com");
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
});

test("product picker is searchable and keyboard operable", async ({ page }) => {
  await openQuote(page);
  const picker = page.getByRole("combobox", { name: "Products" });
  await picker.focus();
  await picker.pressSequentially("sles");
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option")).toHaveCount(2);
  // The first match is active, so Enter picks it; ArrowDown then Enter picks the next one.
  await picker.press("Enter");
  await expect(page.getByRole("button", { name: "Remove SLES 70%" })).toBeVisible();
  await expect(listbox.getByRole("option", { name: /SLES 70%/ })).toHaveAttribute("aria-selected", "true");
  await picker.press("ArrowDown");
  await picker.press("Enter");
  await expect(page.getByRole("button", { name: "Remove SLES 28%" })).toBeVisible();
  // Searching by HSN code works too.
  await picker.fill("29023000");
  await expect(listbox.getByRole("option")).toHaveCount(1);
  await expect(listbox.getByRole("option").first()).toContainText("Toluene");
  await picker.press("Escape");
  await expect(listbox).toBeHidden();
  // Backspace on an empty search removes the last chosen product.
  await picker.fill("");
  await picker.press("Backspace");
  await expect(page.getByRole("button", { name: "Remove SLES 28%" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Remove SLES 70%" })).toBeVisible();
});

test("removing a chip with the keyboard keeps focus in the picker", async ({ page }) => {
  await openQuote(page, "/quote?product=toluene");
  const picker = page.getByRole("combobox", { name: "Products" });
  await picker.fill("methanol");
  await picker.press("Enter");
  await picker.fill("sles 70");
  await picker.press("Enter");
  await picker.press("Escape");
  const remove = (name: string) => page.getByRole("button", { name: `Remove ${name}` });

  // A middle chip: focus moves to the next chip.
  await remove("Methanol").focus();
  await page.keyboard.press("Enter");
  await expect(remove("Methanol")).toHaveCount(0);
  await expect(remove("SLES 70%")).toBeFocused();

  // The last chip: focus moves to the previous chip.
  await page.keyboard.press("Enter");
  await expect(remove("SLES 70%")).toHaveCount(0);
  await expect(remove("Toluene")).toBeFocused();

  // The only chip: focus returns to the search input.
  await page.keyboard.press("Enter");
  await expect(remove("Toluene")).toHaveCount(0);
  await expect(picker).toBeFocused();
});

test("submits and shows success", async ({ page }) => {
  const bodies = await stubQuote(page, { status: 200, body: { ok: true } });
  await openQuote(page, "/quote?product=toluene");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
  await fillValid(page);
  await page.getByRole("button", { name: "Send quote request" }).click();

  await expect(page.getByText(/Thank you/)).toBeVisible();
  expect(bodies).toHaveLength(1);
  const body = bodies[0];
  expect(JSON.stringify(body)).toContain('"products":["toluene"]');
  expect(typeof body.startedAt).toBe("number");
  expect(body.startedAt as number).toBeGreaterThan(0);
  expect(body.website).toBe("");
  expect(body.quantity).toBe(20);
  expect(body.quantityUnit).toBe("kg");
});

test("shows fallback on server error", async ({ page }) => {
  await stubQuote(page, { status: 500, body: { ok: false, error: "save_failed" } });
  await openQuote(page, "/quote?product=toluene");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
  await fillValid(page);
  await page.getByRole("button", { name: "Send quote request" }).click();

  const alert = page.getByRole("alert").filter({ hasText: /not sent/i });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/try again/i);
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Asha Rao");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("asha@example.com");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send quote request" })).toBeEnabled();
});

test("shows a rate-limit message on 429", async ({ page }) => {
  await stubQuote(page, { status: 429, body: { ok: false, error: "rate_limited" } });
  await openQuote(page, "/quote?product=toluene");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
  await fillValid(page);
  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /too many/i })).toBeVisible();
});

test("maps server field errors onto inputs", async ({ page }) => {
  await stubQuote(page, { status: 400, body: { ok: false, error: "invalid", fields: { email: "Invalid email" } } });
  await openQuote(page, "/quote?product=toluene");
  await expect(page.getByRole("button", { name: "Remove Toluene" })).toBeVisible();
  await fillValid(page);
  await page.getByRole("button", { name: "Send quote request" }).click();
  const email = page.getByLabel("Email", { exact: true });
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toBeFocused();
});

test("no axe violations on /quote", async ({ page }) => {
  await openQuote(page);
  const empty = await new AxeBuilder({ page }).analyze();
  expect(empty.violations).toEqual([]);

  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  const errors = await new AxeBuilder({ page }).analyze();
  expect(errors.violations).toEqual([]);

  await page.getByRole("combobox", { name: "Products" }).fill("a");
  await expect(page.getByRole("listbox")).toBeVisible();
  const open = await new AxeBuilder({ page }).analyze();
  expect(open.violations).toEqual([]);
});
