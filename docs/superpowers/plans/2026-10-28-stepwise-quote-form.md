# Step-by-step Quote Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-page quote form with a 7-step form. It captures the lead at step 1 and records every later step against the same row in the owner's Google Sheet, through the Apps Script web app at `apps-script/leads/Code.gs`.

**Architecture:**
- **Logic:** pure TypeScript modules in `src/lib/leads/` hold options, strings, validation, pre-fill, payload building and the sender, and each is unit-tested.
- **UI:** one client component, `StepQuoteForm`, renders the steps with motion and accessibility. Without JavaScript it degrades to a plain form that posts to the same endpoint.
- **Endpoint:** the browser posts directly to the Apps Script `/exec` URL in `NEXT_PUBLIC_LEADS_ENDPOINT`. The old `/api/quote` route and service-account store are removed.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`), React 19, TypeScript, Tailwind 4, Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-28-stepwise-quote-form-design.md`. It builds on `docs/superpowers/specs/2026-10-19-goodbiz-chem-website-design.md`.

## Global Constraints

**Contact and endpoint**
- **WhatsApp:** `+91 8884799369`. The wa.me form is `918884799369`.
- **Email:** `chemicals@goodbizglobal.com`.
- **Location:** `Bengaluru, Karnataka, India`.
- **Endpoint:** env `NEXT_PUBLIC_LEADS_ENDPOINT`. When it is unset or empty, every send fails fast and the form shows the WhatsApp/email fallback.

**Payload**
- Payload keys are exactly the Apps Script `HEADERS`, minus `stage`, `firstSeen` and `updated`, which are server-side. Add `leadId` and `stage`. The keys are: `name, company, email, phone, group, product, otherProduct, quantity, quantityOther, packaging, country, port, terms, notes, sourcePage, userAgent`. Clear marker: `"__clear__"`.
- Stage values: `contact`, `product`, `quantity`, `destination`, `terms` and `submitted`.
- Request: POST, `Content-Type: text/plain;charset=utf-8`, body `JSON.stringify(payload)`. Intermediate sends use `keepalive: true`. Timeout is 15000 ms.

**Spam protection**
- Honeypot field name: `website`. It is a hidden checkbox. When it is checked, show success and send nothing.
- Final send happens no sooner than 3000 ms after mount. If the buyer is faster, delay the send; never drop it.

**Motion and touch**
- Step slide: 16px, 240ms, `cubic-bezier(0.23,1,0.32,1)`. Direction follows the travel direction and is mirrored when `dir="rtl"`.
- Reduced motion: opacity only, 150ms.
- Progress bar: `scaleX`, 320ms, `cubic-bezier(0.77,0,0.175,1)`.
- Press: `scale(0.97)`, 160ms.
- Hover states only under `@media (hover:hover) and (pointer:fine)`.
- Auto-advance after a card or pill tap: 260ms.
- Touch targets: at least 44px tall, 52px for cards.
- Inputs: 16px text.
- Group cards sit 2 across on phones.

**Content and copy**
- English strings live only in `src/lib/leads/strings.ts`.
- Use logical CSS properties (`ps-`, `pe-`, `start`, `end`).
- All other rules from `.superpowers/sdd/.../implementer-common.md` still apply: no invented claims, tokens only, and nothing pushed to `main` without the owner's go-ahead.

## Review Focus

1. **Buyer goes back from step 4 to step 2 and switches to "Something else".** Group and product must be sent as `__clear__`, and step 3 must disappear from the count. Covered by the Task 1 test `payload clears answers that no longer apply` and the Task 2 e2e `back and change to something else clears product`.
2. **Endpoint unset (the state today, before the owner deploys).** Step 1 Next must still advance. The final Send must show the WhatsApp and email fallback with the whole request written out, never a dead end. Covered by the Task 2 e2e `no endpoint shows fallback`.
3. **Hostile or unknown query values**, for example `?product=<script>`, `?group=../x` or `?product=methanol&group=Amines` (a mismatch). These must be ignored or resolved by the product's own group, with no crash and no reflected text. Covered by the Task 1 test `parsePrefill ignores unknown and mismatched values`.
4. **Double-click on Next or Send.** It must produce exactly one request per stage. Covered by the Task 1 test `sender is single-flight per stage` and the Task 2 e2e `double click sends once`.
5. **Phone number typed with spaces, dashes or a leading +.** Seven or more digits must count as valid, and letters must not. Covered by the Task 1 test `contact step accepts email or 7+ digit phone`.

---

### Task 1: Lead form logic (`src/lib/leads/`)

**Files:**
- Create:
  - `src/lib/leads/strings.ts`
  - `src/lib/leads/options.ts`
  - `src/lib/leads/steps.ts`
  - `src/lib/leads/prefill.ts`
  - `src/lib/leads/payload.ts`
  - `src/lib/leads/send.ts`
  - `src/lib/leads/countries.ts`
  - `src/lib/leads/fallback.ts`
- Test:
  - `tests/unit/leads-steps.test.ts`
  - `tests/unit/leads-prefill.test.ts`
  - `tests/unit/leads-payload.test.ts`
  - `tests/unit/leads-send.test.ts`
  - `tests/unit/leads-fallback.test.ts`
  - `tests/unit/apps-script.test.ts` (this one loads `apps-script/leads/Code.gs` through `node:vm` and re-runs the helper checks below)

**Interfaces (Produces):**
```ts
type StepId = "contact" | "group" | "product" | "quantity" | "destination" | "terms" | "notes";
type Answers = {
  name: string; company: string; email: string; phone: string;
  group: ProductGroup | "other" | ""; product: string /* slug | "any" | "" */; otherProduct: string;
  quantity: QuantityId | ""; quantityOther: string; packaging: PackagingId[];
  country: string; port: string; terms: TermsId | ""; notes: string;
};
const emptyAnswers: Answers;
// options.ts
type QuantityId = "trial" | "one-container" | "two-to-five" | "monthly" | "not-sure" | "other";
type PackagingId = "drums" | "ibc" | "bags" | "bulk" | "not-sure";
type TermsId = "fob" | "cfr" | "cif" | "delivered-india" | "not-sure";
const groupOptions: { id: ProductGroup; label: string }[];          // from productGroups
function productOptions(group: ProductGroup): { id: string; label: string }[]; // slugs + names, then { id: "any" }
const quantityOptions, packagingOptions, termsOptions;               // { id, label, hint? }[]
// steps.ts
function visibleSteps(a: Answers, skip: ReadonlySet<StepId>): StepId[]; // drops "product" when group === "other"; drops skipped
function validateStep(step: StepId, a: Answers): Partial<Record<keyof Answers, string>>; // {} when valid
function stageFor(step: StepId): "contact" | "product" | "quantity" | "destination" | "terms" | "submitted";
// prefill.ts
function parsePrefill(params: URLSearchParams, hash?: string): { answers: Partial<Answers>; skip: StepId[] };
// payload.ts
type LeadPayload = Record<string, string> & { leadId: string; stage: string };
function buildPayload(leadId: string, stage: string, a: Answers, everSent: ReadonlySet<string>, meta: { sourcePage: string; userAgent: string }): LeadPayload;
// send.ts
type SendResult = { ok: true } | { ok: false; reason: "no-endpoint" | "timeout" | "network" | "bad-response" };
function createSender(opts: { endpoint: string | undefined; fetchImpl?: typeof fetch; timeoutMs?: number }): {
  send(payload: LeadPayload, opts: { keepalive: boolean }): Promise<SendResult>; // single-flight per payload.stage
};
// countries.ts
function countryNames(locale?: string): string[]; // Intl.DisplayNames(region) over ISO-3166 alpha-2 list, sorted, deduped
// fallback.ts
function requestSummary(a: Answers): string;                      // human-readable multi-line text
function fallbackLinks(a: Answers): { whatsapp: string; email: string }; // wa.me/918884799369?text=…, mailto:chemicals@goodbizglobal.com?subject=…&body=…
```

- [ ] **Step 1: Write failing tests.**
  - `contact step accepts email or 7+ digit phone`:
    - Valid: `name` "Asha" with `email` "a@b.co"; `name` "Asha" with `phone` "+91 98765-43210".
    - Invalid:
      - missing name → `name` error;
      - name plus `phone` "12345" with no email → `email` error, which is the slot the hint sits under;
      - name plus `phone` "abcdefg" → error.
  - `group step requires a group or something else with text`:
    - `"other"` with an empty `otherProduct` → `otherProduct` error.
  - `product step accepts any`; `quantity other needs text`; `destination needs country`; `terms needs a choice`; `notes always valid`.
  - `visibleSteps skips product for something else and honours skip`: with `group:"other"`, the result has no `"product"`. With skip `{group, product}`, the result is `[contact, quantity, destination, terms, notes]`.
  - `parsePrefill`:
    - `?product=methanol` → answers `{group:"Solvents", product:"methanol"}`, skip `[group, product]`.
    - `?group=surfactants` → `{group:"Surfactants"}`, skip `[group]`.
    - `?group=other` or hash `#other` → `{group:"other"}`, no skip (the text box must still be filled).
    - Ignored: `?product=<script>`, `?product=nope`, `?group=../x`.
    - `?product=methanol&group=Amines` → the product wins, with its own group.
  - `payload carries every key and the same leadId`: every key from the Global Constraints list is present. Empty fields that were never sent are `""`.
  - `payload clears answers that no longer apply`: after `group` and `product` were sent, switching to `"other"` sends both as `"__clear__"`. Packaging joins with `", "`, using the human labels.
  - `sender posts text/plain JSON with keepalive and times out at 15s`: use fake timers and a mock fetch that never resolves → `{ok:false, reason:"timeout"}`. Check the request has `method: "POST"`, header `content-type` `text/plain;charset=utf-8`, and `keepalive` passed through.
  - `sender with no endpoint fails fast`: `{ok:false, reason:"no-endpoint"}`, and fetch is never called.
  - `sender is single-flight per stage`: two concurrent sends with stage `submitted` → fetch is called once, and both promises resolve to the same result.
  - `sender treats {ok:false} or non-JSON as bad-response`.
  - `fallbackLinks encode the whole request`: the decoded WhatsApp text and email body contain the name, product label, quantity, country and terms. The WhatsApp URL starts with `https://wa.me/918884799369?text=`.
  - `countryNames` includes "India", "United Arab Emirates" and "Germany", and has no duplicates.
  - `apps-script.test.ts` covers `mergeRow` keep/clear/never-blank, `safeCell`, `furthestStage` and `alertKind`, using the same cases the controller verified.
- [ ] **Step 2:** Run `npm test -- leads apps-script`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement the modules.**
  - Labels and hints are in `strings.ts`. Use the spec's exact terms lines:
    - FOB: "You arrange shipping from the Indian port."
    - CFR: "We ship to your port; you insure."
    - CIF: "We ship and insure to your port."
    - Delivered within India: "For buyers in India."
    - Not sure: "We'll suggest the best option."
  - Quantity labels: Trial / sample, 1 container, 2–5 containers, Regular monthly supply, Not sure yet, Another amount.
  - Packaging labels: Drums, IBC tanks, Bags, Bulk tanker / ISO tank, Not sure.
- [ ] **Step 4:** Run `npm test`. Expected: all tests pass.
- [ ] **Step 5:** Commit: `feat: step-by-step lead form logic`.

### Task 2: StepQuoteForm UI and wiring

**Files:**
- Create:
  - `src/components/StepQuoteForm.tsx` (client)
  - `src/components/lead-steps/*.tsx` (one small component per step, plus `ChoiceCard`, `Pill`, `ProgressBar`, `SuccessCheck`), and `GroupIllustration.tsx` (an inline SVG per group)
- Modify:
  - `src/app/quote/page.tsx`
  - `src/app/quote/QuoteFormFromQuery.tsx`, renamed to `StepQuoteFormFromQuery.tsx`
  - `src/app/contact/page.tsx`
  - `src/app/products/[slug]/page.tsx`
  - `src/config/site.ts` (contact values)
  - `src/lib/seo/jsonld.ts` (address locality and region)
  - `.env.example`
  - `README.md`
- Delete:
  - `src/components/QuoteForm.tsx`, `src/components/ProductPicker.tsx`
  - `src/app/api/quote/route.ts`
  - `src/lib/quote/*`
  - `tests/unit/quote.test.ts`, `tests/unit/sheets-store.test.ts`, `tests/e2e/quote.spec.ts`
- Test: `tests/e2e/step-quote.spec.ts`. Update the e2e and unit tests that referenced the old form or the empty contact.

**Interfaces:**
- **Consumes:** everything from Task 1.
- **Produces:** `<StepQuoteForm initial?: { answers: Partial<Answers>; skip: StepId[] } compact?: boolean />`. Product pages pass `parsePrefill(new URLSearchParams({product: slug}))`. `/quote` reads the query and hash on the client inside `<Suspense>`.
- **Site config:** `site.contact = { email: "chemicals@goodbizglobal.com", phone: "+91 8884799369", whatsapp: "+91 8884799369", address: "Bengaluru, Karnataka, India" }`.
- **Organization JSON-LD address:** `{ addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" }`, with no `streetAddress`. Keep the existing contactPoint logic. Dedupe identical phone and WhatsApp entries.

- [ ] **Step 1: Write the failing e2e tests** in `tests/e2e/step-quote.spec.ts`. Run every test in both projects. Each test stubs the endpoint by setting `NEXT_PUBLIC_LEADS_ENDPOINT=http://localhost:3100/__leads` at build time in the e2e config, and routes `**/__leads` with `page.route`. Record each request body.
  - **`contact-first send`:** fill name and email, then press Next. One request arrives with `stage:"contact"`, the name and the email. The heading of step 2 is visible.
  - **`auto-advance and back`:**
    - Tap the Solvents card. About 260ms later, step 3 shows the Solvents pills.
    - Press Back. Step 2 shows with Solvents selected.
    - "Step 2 of 7" changes to "Step 3 of 7" and back.
  - **`arrow keys change selection without advancing`:** on step 2, press ArrowRight. The selection moves and the step stays the same.
  - **`prefill skips product steps`:** open `/products/methanol`, then fill and submit contact. The next screen is quantity, the label reads "Step 2 of 5", and the request has `product:"Methanol"`.
  - **`something else skips step 3`:**
    - Tap "Something else". The text box opens and the step stays.
    - Type "Glycerine" and press Next. The next screen is quantity, and the total shows 6.
  - **`back and change to something else clears product`:** the request after the change has `group:"__clear__"` and `product:"__clear__"`.
  - **`full flow keeps one leadId`:** run every step to Send. All request bodies share one leadId. Stages arrive in order and end with `submitted`. The success heading is focused.
  - **`double click sends once`:** double-click Send. Exactly one request has `stage:"submitted"`.
  - **`fast submit is delayed not dropped`:** the full flow completes within 3s of mount. The submitted request still arrives, at 3000ms or later.
  - **`failure shows fallback`:** route the endpoint to return 500, then press Send. "Send on WhatsApp" and "Send by email" links are visible, and their decoded hrefs contain the buyer's name and product.
  - **`no endpoint shows fallback`:** add a separate Playwright project or env without the endpoint. Step 1 still advances, and Send shows the fallback.
  - **`honeypot shows success and sends nothing`:** check the hidden checkbox through the DOM, then press Send. Success shows, and no `submitted` request is sent.
  - **`no-JS shows all steps`:** run in a `javaScriptEnabled:false` context. Every step's fields are visible. The form `action` is the endpoint and its `method` is `post`.
  - **`axe clean on each step`.**
- [ ] **Step 2:** Run `npm run e2e -- step-quote` on your own `next start -p 3100`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Required skills:** invoke `hallmark`, `ui-ux-pro-max:ui-ux-pro-max` and `emil-design-eng` first, and follow `docs/design/direction.md`.
  - **Structure:**
    - Render a real `<form method="post" action={endpoint}>`. Every step is rendered in the HTML.
    - After hydration, hide the steps that are not current, so the no-JS form keeps every step.
    - `leadId` comes from `crypto.randomUUID()` in a `useState` initialiser.
    - Keep `everSent` in a ref.
  - **Focus:** on each step change, move focus to the step heading (`tabIndex=-1`). On a validation error, move focus to the first invalid field.
  - **Choices:**
    - Cards and pills are radio-group semantics (`role="radiogroup"`) with roving tabindex.
    - Packaging pills are checkboxes.
  - **Country field:** use an `<input list>` with a `<datalist>` built from `countryNames("en")`.
  - **Scrolling:** after a step change, if the form top is above the viewport or below the fold, call `scrollIntoView({block:"start"})`. Set `scroll-margin-top` to the header height.
  - **Success check mark:** an SVG `stroke-dashoffset` animation that runs once. With reduced motion, show it instantly.
- [ ] **Step 4: Wire it in, remove the old form, update copy and docs.**
  - Put `StepQuoteForm` on `/quote`, `/contact` and the product pages, where it replaces `QuoteForm`.
  - Remove the old form, its backend and its tests (the files listed above).
  - Update the contact config and the JSON-LD address.
  - README:
    - Replace the Google service-account section with a pointer to `docs/leads-apps-script.md` and the `NEXT_PUBLIC_LEADS_ENDPOINT` row.
    - Add the goodbizchemicals.com domain steps: in Vercel → Domains, add `www.goodbizchemicals.com` and redirect the apex to it; set `SITE_URL=https://www.goodbizchemicals.com`; redeploy.
  - `.env.example`: remove the `GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_RANGE` entries, and add `NEXT_PUBLIC_LEADS_ENDPOINT`.
- [ ] **Step 5: Run the full checks.** Run `npm test`, `npm run lint`, `npm run build`, and the full `npm run e2e` on 3100. Expected: all green.
- [ ] **Step 6: Phone-width check.** Use playwright-cli to take screenshots at 375 and 1440 of: every step, the fallback, success, the product-page embed and the no-JS view. Save them as `shots/sq-*`. Read them back and iterate until they look right.
- [ ] **Step 7: Commit** in logical groups, ending with `feat: step-by-step quote form`. Do not push.
