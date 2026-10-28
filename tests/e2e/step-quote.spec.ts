import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "./fixtures";

/** NEXT_PUBLIC_LEADS_ENDPOINT in the main e2e build (playwright.config.ts). */
const LEADS_STUB = "http://localhost:3100/__leads";

type Body = Record<string, string>;

const headings = {
  contact: "Your contact details",
  group: "What do you need?",
  product: "Which product?",
  quantity: "How much do you need?",
  destination: "Where should it go?",
  terms: "Which shipping terms?",
  notes: "Anything else we should know?",
  success: "Thank you. Your request is in.",
  failed: "Your request has not reached us yet",
} as const;

/** Routes the leads endpoint and records every JSON body posted to it. */
async function stubLeads(page: Page, status = 200): Promise<Body[]> {
  const bodies: Body[] = [];
  await page.route("**/__leads", async (route) => {
    bodies.push(JSON.parse(route.request().postData() ?? "{}") as Body);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ ok: status === 200 }) });
  });
  return bodies;
}

/** Opens a page with the quote form and waits until React has hydrated it. */
async function openForm(page: Page, url = "/quote"): Promise<Locator> {
  await page.goto(url);
  const form = page.locator("form[data-lead-form][data-hydrated]");
  await expect(form).toBeVisible();
  return form;
}

const heading = (page: Page, name: string) => page.getByRole("heading", { name, exact: true });

/** Waits until the step slide and progress bar have finished. */
async function settled(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
}

/** Taps a card or pill: the visible label that wraps the radio or checkbox. */
function option(form: Locator, name: string): Locator {
  return form.locator("label").filter({ has: form.page().getByRole("radio", { name, exact: true }) })
    .or(form.locator("label").filter({ has: form.page().getByRole("checkbox", { name, exact: true }) }));
}

async function fillContact(page: Page, form: Locator) {
  await form.getByLabel("Your name", { exact: true }).fill("Asha Rao");
  await form.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.group).or(heading(page, headings.quantity))).toBeVisible();
}

/** From step 1 on /quote to the notes step: Solvents → Methanol → 1 container → Germany → CIF. */
async function runToNotes(page: Page, form: Locator) {
  await fillContact(page, form);
  await option(form, "Solvents").click();
  await expect(heading(page, headings.product)).toBeVisible();
  await option(form, "Methanol").click();
  await expect(heading(page, headings.quantity)).toBeVisible();
  await option(form, "1 container").click();
  await expect(heading(page, headings.destination)).toBeVisible();
  await form.getByLabel("Destination country", { exact: true }).fill("Germany");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.terms)).toBeVisible();
  await option(form, "CIF").click();
  await expect(heading(page, headings.notes)).toBeVisible();
}

test("contact-first send", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page);
  await form.getByLabel("Your name", { exact: true }).fill("Asha Rao");
  await form.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.group)).toBeVisible();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ stage: "contact", name: "Asha Rao", email: "asha@example.com" });
});

test("contact step shows inline errors and focuses the first invalid field", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  await form.getByRole("button", { name: "Next" }).click();
  const name = form.getByLabel("Your name", { exact: true });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Please enter your name.")).toBeVisible();
  await expect(heading(page, headings.contact)).toBeVisible();

  // With a name but no way to reply, the email field asks for one; the hint wording is not reused as the error.
  await name.fill("Asha Rao");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(form.getByLabel("Email", { exact: true })).toBeFocused();
  await expect(form.getByText("Please add an email or a WhatsApp number.")).toBeVisible();
  await expect(form.getByText("Email or WhatsApp is enough.")).toBeHidden();
});

test("auto-advance and back", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  await fillContact(page, form);
  await expect(form.getByText("Step 2 of 7")).toBeVisible();

  const started = Date.now();
  await option(form, "Solvents").click();
  await expect(heading(page, headings.product)).toBeVisible();
  expect(Date.now() - started).toBeGreaterThanOrEqual(250);
  await expect(form.getByText("Step 3 of 7")).toBeVisible();
  await expect(option(form, "Methanol")).toBeVisible();
  await expect(option(form, "Diisopropylamine")).toBeHidden();
  await expect(heading(page, headings.product)).toBeFocused();

  await form.getByRole("button", { name: "Back" }).click();
  await expect(heading(page, headings.group)).toBeVisible();
  await expect(form.getByRole("radio", { name: "Solvents", exact: true })).toBeChecked();
  await expect(form.getByText("Step 2 of 7")).toBeVisible();
});

test("arrow keys change selection without advancing", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  await fillContact(page, form);
  await form.getByRole("radio", { name: "Solvents", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(form.getByRole("radio", { name: "Amines", exact: true })).toBeChecked();
  await page.waitForTimeout(600);
  await expect(heading(page, headings.group)).toBeVisible();
  await expect(form.getByText("Step 2 of 7")).toBeVisible();
});

test("prefill skips product steps", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page, "/products/methanol");
  await fillContact(page, form);
  await expect(heading(page, headings.quantity)).toBeVisible();
  await expect(form.getByText("Step 2 of 5")).toBeVisible();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toMatchObject({ stage: "contact", group: "Solvents", product: "Methanol" });
});

test("quote link with a product skips product steps too", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page, "/quote?product=toluene");
  await fillContact(page, form);
  await expect(heading(page, headings.quantity)).toBeVisible();
  await expect(form.getByText("Step 2 of 5")).toBeVisible();
});

test("/quote#other opens step 2 with something else chosen", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page, "/quote#other");
  await fillContact(page, form);
  await expect(form.getByRole("radio", { name: "Something else", exact: true })).toBeChecked();
  await expect(form.getByLabel("Which chemical?")).toBeFocused();
});

test("a client-side link to /quote#other chooses something else", async ({ page }) => {
  await stubLeads(page);
  await openForm(page, "/products/methanol");
  await page.getByRole("link", { name: "We also source chemicals not listed here" }).click();
  await expect(page).toHaveURL(/\/quote#other$/);
  // Next keeps the product page mounted but hidden after a client-side navigation; use the visible form.
  const form = page.locator("form[data-lead-form][data-hydrated]:visible");
  await expect(form.getByText("Step 1 of 6")).toBeVisible();
  await fillContact(page, form);
  await expect(form.getByRole("radio", { name: "Something else", exact: true })).toBeChecked();
  await expect(form.getByLabel("Which chemical?")).toBeFocused();
});

test("changing the hash to #other on /quote chooses something else", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  await expect(form.getByText("Step 1 of 7")).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = "other";
  });
  await expect(form.getByText("Step 1 of 6")).toBeVisible();
  await fillContact(page, form);
  await expect(form.getByRole("radio", { name: "Something else", exact: true })).toBeChecked();
});

test("something else skips step 3", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  await fillContact(page, form);
  await option(form, "Something else").click();
  const other = form.getByLabel("Which chemical?");
  await expect(other).toBeVisible();
  await page.waitForTimeout(600);
  await expect(heading(page, headings.group)).toBeVisible();
  await other.fill("Glycerine");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.quantity)).toBeVisible();
  await expect(form.getByText("Step 3 of 6")).toBeVisible();
});

test("back and change to something else clears product", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page);
  await fillContact(page, form);
  await option(form, "Solvents").click();
  await option(form, "Methanol").click();
  await expect(heading(page, headings.quantity)).toBeVisible();
  await expect.poll(() => bodies.filter((b) => b.product === "Methanol").length).toBeGreaterThan(0);

  await form.getByRole("button", { name: "Back" }).click();
  await expect(heading(page, headings.product)).toBeVisible();
  await form.getByRole("button", { name: "Back" }).click();
  await expect(heading(page, headings.group)).toBeVisible();
  await option(form, "Something else").click();
  await form.getByLabel("Which chemical?").fill("Glycerine");
  const before = bodies.length;
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.quantity)).toBeVisible();
  await expect(form.getByText("Step 3 of 6")).toBeVisible();
  await expect.poll(() => bodies.length).toBe(before + 1);
  expect(bodies.at(-1)).toMatchObject({ group: "__clear__", product: "__clear__", otherProduct: "Glycerine" });
});

test("full flow keeps one leadId", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page);
  await runToNotes(page, form);
  await form.getByLabel("Notes").fill("Need 99.85% grade.");
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(heading(page, headings.success)).toBeFocused({ timeout: 10_000 });

  const ids = new Set(bodies.map((b) => b.leadId));
  expect(ids.size).toBe(1);
  expect([...ids][0]).toMatch(/^[0-9a-f-]{36}$/);
  expect(bodies.map((b) => b.stage)).toEqual(["contact", "product", "product", "quantity", "destination", "terms", "submitted"]);
  expect(bodies.at(-1)).toMatchObject({
    name: "Asha Rao",
    group: "Solvents",
    product: "Methanol",
    quantity: "1 container",
    country: "Germany",
    terms: "CIF",
    notes: "Need 99.85% grade.",
    sourcePage: "/quote",
  });
  await expect(form.getByRole("button", { name: "Send request" })).toBeHidden();
});

test("double click sends once", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page);
  await runToNotes(page, form);
  await form.getByRole("button", { name: "Send request" }).dblclick();
  await expect(heading(page, headings.success)).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(500);
  expect(bodies.filter((b) => b.stage === "submitted")).toHaveLength(1);
});

test("fast submit is delayed not dropped", async ({ page }) => {
  await stubLeads(page);
  // Record when each lead request leaves the page, on the page's own clock.
  await page.addInitScript(() => {
    const calls: { stage: string; at: number }[] = [];
    (window as unknown as { __leadCalls: typeof calls }).__leadCalls = calls;
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (String(input).includes("/__leads")) {
        calls.push({ stage: JSON.parse(String(init?.body ?? "{}")).stage, at: performance.now() });
      }
      return original(input, init);
    };
  });
  const form = await openForm(page, "/quote?product=methanol");
  await form.getByLabel("Your name", { exact: true }).fill("Asha Rao");
  await form.getByLabel("Email", { exact: true }).fill("asha@example.com");
  await form.getByRole("button", { name: "Next" }).click();
  await option(form, "Trial / sample").click();
  await form.getByLabel("Destination country", { exact: true }).fill("India");
  await form.getByRole("button", { name: "Next" }).click();
  await option(form, "FOB").click();
  await expect(heading(page, headings.notes)).toBeVisible();
  const clickedAt = await page.evaluate(() => performance.now());
  await form.getByRole("button", { name: "Send request" }).click();
  // While the send waits out the 3 s, the buyer cannot step back or edit the notes.
  await expect(form.getByRole("button", { name: "Back" })).toBeDisabled();
  await expect(form.getByLabel("Notes")).toBeDisabled();
  await expect(heading(page, headings.success)).toBeVisible({ timeout: 10_000 });

  const { mountedAt, submittedAt } = await page.evaluate(() => {
    const marks = performance.getEntriesByName("quote-form-mounted");
    const calls = (window as unknown as { __leadCalls: { stage: string; at: number }[] }).__leadCalls;
    return { mountedAt: marks.at(-1)!.startTime, submittedAt: calls.find((c) => c.stage === "submitted")!.at };
  });
  expect(clickedAt - mountedAt, "the buyer finished inside 3 s").toBeLessThan(3000);
  expect(submittedAt - mountedAt).toBeGreaterThanOrEqual(3000);
});

test("failure shows fallback", async ({ page }) => {
  await stubLeads(page, 500);
  const form = await openForm(page);
  await runToNotes(page, form);
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(heading(page, headings.failed)).toBeFocused({ timeout: 10_000 });

  const whatsapp = form.getByRole("link", { name: "Send on WhatsApp" });
  const email = form.getByRole("link", { name: "Send by email" });
  await expect(whatsapp).toBeVisible();
  await expect(email).toBeVisible();
  const wa = decodeURIComponent((await whatsapp.getAttribute("href"))!);
  const mail = decodeURIComponent((await email.getAttribute("href"))!);
  expect(wa.startsWith("https://wa.me/918884799369?text=")).toBe(true);
  expect(mail.startsWith("mailto:chemicals@goodbizglobal.com?")).toBe(true);
  for (const href of [wa, mail]) {
    expect(href).toContain("Asha Rao");
    expect(href).toContain("Methanol");
  }  // The buyer can also retry from the form.
  await expect(form.getByRole("button", { name: "Try again" })).toBeVisible();

  await settled(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, "fallback panel").toEqual([]);
});

test("no endpoint shows fallback @no-endpoint", async ({ page }) => {
  const form = await openForm(page);
  await fillContact(page, form);
  await expect(heading(page, headings.group)).toBeVisible();
  await option(form, "Solvents").click();
  await option(form, "Methanol").click();
  await option(form, "1 container").click();
  await form.getByLabel("Destination country", { exact: true }).fill("Germany");
  await form.getByRole("button", { name: "Next" }).click();
  await option(form, "CIF").click();
  await expect(heading(page, headings.notes)).toBeVisible();
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(heading(page, headings.failed)).toBeVisible({ timeout: 10_000 });
  const wa = decodeURIComponent((await form.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href"))!);
  expect(wa).toContain("Asha Rao");
  expect(wa).toContain("Methanol");
  await expect(form.getByRole("link", { name: "Send by email" })).toBeVisible();
});

test("honeypot shows success and sends nothing", async ({ page }) => {
  const bodies = await stubLeads(page);
  const form = await openForm(page);
  await runToNotes(page, form);
  await form.locator('input[name="website"]').evaluate((el: HTMLInputElement) => {
    el.checked = true;
  });
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(heading(page, headings.success)).toBeVisible();
  await page.waitForTimeout(3500);
  expect(bodies.filter((b) => b.stage === "submitted")).toHaveLength(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("no-JS shows all steps", async ({ page }) => {
    await page.goto("/quote");
    const form = page.locator("form[data-lead-form]");
    await expect(form).toHaveAttribute("action", LEADS_STUB);
    await expect(form).toHaveAttribute("method", "post");

    for (const name of Object.values(headings).slice(0, 7)) await expect(heading(page, name)).toBeVisible();
    for (const label of ["Your name", "Company", "Email", "WhatsApp or phone", "Which chemical?", "Amount", "Destination country", "Port or city", "Notes"]) {
      await expect(form.getByLabel(label, { exact: true })).toBeVisible();
    }
    for (const name of ["Solvents", "Something else", "Methanol", "Diisopropylamine", "1 container", "Drums", "CIF"]) {
      await expect(option(form, name).first()).toBeVisible();
    }
    await expect(form.getByRole("button", { name: "Send request" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Next" })).toBeHidden();
    // The same English labels the JavaScript payload sends, under the same keys.
    await expect(form.locator('input[name="terms"][value="CIF"]')).toHaveCount(1);
    await expect(form.locator('input[name="quantity"][value="1 container"]')).toHaveCount(1);
    await expect(form.locator('input[name="group"][value="Solvents"]')).toHaveCount(1);
    await expect(form.locator('input[name="leadId"]')).toHaveValue("");
    await expect(form.locator('input[name="stage"]')).toHaveValue("submitted");
  });

  test("no-JS on a product page posts the pre-filled product", async ({ page }) => {
    await page.goto("/products/methanol");
    const form = page.locator("form[data-lead-form]");
    await expect(form).toHaveAttribute("action", LEADS_STUB);
    await expect(form.locator('input[type="hidden"][name="group"]')).toHaveValue("Solvents");
    await expect(form.locator('input[type="hidden"][name="product"]')).toHaveValue("Methanol");
    // The type and product steps are skipped, not shown.
    await expect(heading(page, headings.group)).toHaveCount(0);
    await expect(heading(page, headings.product)).toHaveCount(0);
    await expect(heading(page, headings.quantity)).toBeVisible();
  });

  test("no-JS without an endpoint offers WhatsApp and email instead of a dead Send @no-endpoint", async ({ page }) => {
    await page.goto("/quote");
    const form = page.locator("form[data-lead-form]");
    await expect(form).not.toHaveAttribute("action", /.*/);
    await expect(form.getByRole("button", { name: "Send request" })).toHaveCount(0);
    await expect(form.getByRole("button")).toHaveCount(0);
    await expect(form.getByRole("link", { name: "Send on WhatsApp" })).toHaveAttribute("href", "https://wa.me/918884799369");
    await expect(form.getByRole("link", { name: "Send by email" })).toHaveAttribute("href", "mailto:chemicals@goodbizglobal.com");
  });
});

test("requests to the live leads script are blocked in every test", async ({ page }) => {
  await page.goto("/quote");
  const reached = await page.evaluate(() =>
    fetch("https://script.google.com/macros/s/guard-check/exec", { method: "POST", mode: "no-cors", body: "{}" }).then(
      () => true,
      () => false,
    ),
  );
  expect(reached).toBe(false);
});

test("axe clean on each step", async ({ page }) => {
  await stubLeads(page);
  const form = await openForm(page);
  const check = async (step: string) => {
    await settled(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, step).toEqual([]);
  };
  await check("contact");
  await fillContact(page, form);
  await check("group");
  await option(form, "Solvents").click();
  await expect(heading(page, headings.product)).toBeVisible();
  await check("product");
  await option(form, "Methanol").click();
  await expect(heading(page, headings.quantity)).toBeVisible();
  await check("quantity");
  await option(form, "Drums").click();
  await option(form, "1 container").click();
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.destination)).toBeVisible();
  await check("destination");
  await form.getByLabel("Destination country", { exact: true }).fill("Germany");
  await form.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, headings.terms)).toBeVisible();
  await check("terms");
  await option(form, "CIF").click();
  await expect(heading(page, headings.notes)).toBeVisible();
  await check("notes");
  await form.getByRole("button", { name: "Send request" }).click();
  await expect(heading(page, headings.success)).toBeVisible({ timeout: 10_000 });
  await check("success");
});
