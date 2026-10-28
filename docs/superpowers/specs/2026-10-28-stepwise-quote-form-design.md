# Step-by-step quote form, Apps Script lead capture and domain move: design

Date: 2026-10-28
Status: approved by owner 2026-10-28 ("build the step by step form")
Builds on: `docs/superpowers/specs/2026-10-19-goodbiz-chem-website-design.md` (that spec still applies wherever this one doesn't override it)

## Intent

Buyers give up when they meet a wall of fields. The quote form becomes a short sequence of screens. Each screen asks one small thing, mostly by tapping, so it never feels like work.

**The most important rule: never lose a visitor's contact details.** The lead is captured the moment they finish the first screen, even if they stop afterwards.

Success means:
- more buyers start a quote request than before;
- every buyer who gets past screen 1 appears as a row in the Goodbiz Chem Google Sheet;
- an alert email reaches chemicals@goodbizglobal.com.

## Owner facts (supplied 2026-10-28)

- **Domain:** https://www.goodbizchemicals.com, bought by the owner. The site moves there.
- **Google Workspace** is on goodbizglobal.com. **chemicals@goodbizglobal.com** is an alias that receives all chemical leads.
- **WhatsApp / phone:** +91 8884799369.
- **Location:** Bengaluru, Karnataka, India.
- **Public contact email:** chemicals@goodbizglobal.com (my call, which the owner didn't object to).

The owner approved the step design below ("no mistake").

## Goals

- A 7-step quote form (steps below) replaces the current single-page form everywhere it appears: `/quote`, `/contact` and every product page.
- Contact details are sent to the backend as soon as step 1 is complete. Each later step updates the **same** row.
- Leads are stored in a Google Sheet owned by the owner's Workspace account, through a Google Apps Script web app. There is no server-side service account any more.
- An email alert goes to chemicals@goodbizglobal.com when a lead first arrives (stage `contact`) and when the request is completed (stage `submitted`).
- The real contact details go into the site config, so the footer, Contact page, JSON-LD and llms.txt show them.
- The site moves to www.goodbizchemicals.com.

## Non-goals

- More languages. The site stays English-only. All form strings live in one dictionary file, and the layout uses logical CSS properties (`inline-start`/`end`) and mirrors its motion direction under `dir="rtl"`, so adding a language later is a content job. Translating now is out of scope (my call; the owner's template mentioned "all N languages", but the site has one).
- Product photography. The step 2 cards use clean illustrations or icons per product group, in brand pastels (my call; there are no product photos).
- CRM integration. That is still later.
- Turning search indexing on. That remains the owner's switch (`ALLOW_INDEXING`). Real contact details now make it possible.

## Anti-goals

- Any path where a buyer who typed their contact details and pressed Next is not recorded.
- A fast but valid submit being dropped as spam. It may be delayed, never dropped.
- Two rows for one visitor.
- A double click sending twice.
- Losing the current visual direction (pastel on white, green brand, clean and professional) or adding invented claims.

## The steps (one per screen)

1. **Contact.**
   - Fields: name (required), company (optional), email, WhatsApp/phone.
   - Validation: name, plus either a valid email or a phone number with 7 or more digits. Hint: "Email or WhatsApp is enough."
   - Tapping Next sends stage `contact`. This is the lead.
2. **Product type.** Four cards: Solvents, Amines, Inorganics, Surfactants. Each card has an illustration and the group name.
   - Below them is a full-width **"Something else"** card. It opens a text box, "Which chemical? e.g. Glycerine, CAS 56-81-5", and choosing it **skips step 3**. This replaces the current "Other chemical" field.
3. **Product.** Pill buttons for the products in the chosen group, plus "Any / not sure".
   - Single select (my call), because the old multi-select was rarely needed and tapping should advance. A buyer wanting several products can say so in notes.
4. **Quantity.** Pills: Trial / sample · 1 container · 2–5 containers · Regular monthly supply · "Another amount".
   - "Another amount" opens a text box and stays on the step.
   - Below the quantity pills, optional packaging pills: Drums · IBC tanks · Bags · Bulk tanker / ISO tank · Not sure.
   - The step auto-advances only when the quantity is tapped and no packaging has been touched yet. Otherwise the buyer presses Next. My call: this way packaging remains reachable.
5. **Destination.**
   - A country text field with type-ahead suggestions. Country names come from `Intl.DisplayNames` (English) over the ISO 3166 region list.
   - An optional port or city field.
   - Free text is accepted if it doesn't match a suggestion.
6. **Shipping terms.** Cards, each with one plain line:
   - **FOB:** you arrange shipping from the Indian port.
   - **CFR:** we ship to your port; you insure.
   - **CIF:** we ship and insure to your port.
   - **Delivered within India:** for domestic buyers.
   - **Not sure:** we'll suggest the best option.
7. **Notes** (optional free text), then **Send**.

## Behaviour

**Moving between steps**
- Tapping a card or pill moves on by itself after about 260 ms, enough time to see the selection land.
- Arrow keys only change the selection and never advance.
- "Something else" and "Another amount" open their text box and stay on the step.
- A "Step N of M" label and a thin progress bar show position. M excludes skipped steps.
- Every step except the first has a Back button. Enter means Next.

**Sending each step**
- Every Next sends that step's answers to the backend, along with all answers given so far.
- The same `leadId` (`crypto.randomUUID()`, generated once per form instance) goes with every send, so the backend updates one row per visitor.
- Intermediate sends use `fetch` with `keepalive: true`. The final send has stage `submitted`.
- Each send has a 15 s timeout.

**Pre-fill from links**
- Links from product pages (`/quote?product=<slug>`, and the product page's embedded form) pre-fill and **skip** steps 2 and 3 instead of showing them filled.
- `?group=<group>` pre-fills and skips step 2 only.
- Unknown or hostile query values are ignored.
- Pre-fill is scoped to its own option group, because option ids repeat across groups (for example "not-sure").

**Validation**
- Only the current step is validated.
- An error appears inline under the field, and focus moves to that field.

**Spam protection**
- A hidden honeypot checkbox. If it is ticked, the form silently shows success and sends nothing.
- The final send happens no sooner than 3 s after the form mounted. A faster valid submit is **delayed** until 3 s, never dropped.

**When sending fails**
- If a send fails, times out, or no endpoint is configured, the form shows a **"Send on WhatsApp"** button (`https://wa.me/918884799369?text=…`) and a **"Send by email"** button (`mailto:chemicals@goodbizglobal.com?subject=…&body=…`).
- Both carry the whole request, already written out.
- An intermediate-step failure does not block the buyer. It is retried with the next send, which carries all answers.

**Success**
- The steps are hidden. A check mark draws itself once, and focus moves to the success heading.

**Without JavaScript**
- Every step shows at once as one plain form. It posts form-encoded data to the same Apps Script endpoint.

**Double sends**
- Each send is guarded so that double-clicking Next or Send sends once.

## Design (Emil Kowalski principles, using the existing tokens in `docs/design/direction.md`)

**Motion**
- **Step change:** the new step slides in 16 px from the direction of travel and fades in over 240 ms with `cubic-bezier(0.23,1,0.32,1)`. Going back enters from the other side, and the direction mirrors under RTL. With reduced motion, use opacity only, over 150 ms.
- **Progress bar:** `transform: scaleX`, 320 ms, `cubic-bezier(0.77,0,0.175,1)`. Never animate width.
- **Press feedback:** cards, pills and buttons scale to 0.97 when pressed (160 ms). Hover effects only apply under `@media (hover:hover) and (pointer:fine)`.

**Look and touch**
- A selected card gets a brand-colour border or ring. A selected pill fills with brand colour. The focus ring uses `:has(:focus-visible)`.
- Touch targets are 44–52 px. On phones, group cards sit 2 across (my call: there are 4 groups plus "Something else", and 2×2 plus a full-width card fits one screen). Pills wrap.
- Inputs use a 16 px font so iOS doesn't zoom. Empty error slots are hidden.

**Scrolling and placement**
- When a step change happens below the fold, the form scrolls into view below the sticky header.
- On product pages the form is embedded with steps 2 and 3 skipped, so 5 steps show.

## Backend: Google Apps Script web app

- **Config:** the endpoint URL lives in config as `NEXT_PUBLIC_LEADS_ENDPOINT`. Until it is set, the form goes straight to the WhatsApp and email fallback.
- **Request format:** the client POSTs JSON as `Content-Type: text/plain`, which avoids a CORS preflight that Apps Script cannot answer.
- **`doPost`:**
  - Takes a script lock.
  - Finds the row by `leadId`, updating it if present and appending one if not.
  - Keeps `firstSeen` and sets `updated`.
  - Never overwrites a filled cell with an empty value.
  - Prefixes any value starting with `= + - @`, tab or CR with `'`.
  - Emails an alert to `chemicals@goodbizglobal.com` on stages `contact` and `submitted`. The alert uses `MailApp`, with Reply-To set to the buyer's email if given. The alert subject includes the buyer name and product.
  - Returns `{ok:true}`.
  - Also accepts a form-encoded post (the no-JS case) and returns a simple HTML thank-you page linking back to the site.
  - Ignores bodies with the honeypot set.
- **Sheet columns** (one header row, created by a `setup()` function in the script):
  - leadId, stage, firstSeen, updated
  - name, company, email, phone
  - group, product, otherProduct
  - quantity, quantityOther, packaging
  - country, port, terms, notes
  - sourcePage, userAgent
- **Setup doc** (`docs/leads-apps-script.md`, plus a README section):
  1. Create the sheet in the goodbizglobal.com Workspace.
  2. Extensions → Apps Script.
  3. Paste the script.
  4. Run `setup()` once.
  5. Deploy as a web app (Execute as: me; Who has access: Anyone).
  6. Copy the `/exec` URL into Vercel as `NEXT_PUBLIC_LEADS_ENDPOINT`.
  7. Redeploy.
  - It explains that alerts go to the alias and how to change the address.
- **Removals:** the old server route `/api/quote`, the service-account store (`sheets-store.ts`, `store.ts`), its env vars (`GOOGLE_*`) and the related README sections are removed (my call). The owner's chosen path is Apps Script, and keeping two backends would confuse them.
- **Trade-off:** losing the server-side rate limit is accepted; the honeypot and the 3 s minimum remain.

## Site-wide updates from the owner facts

- **Contact config:** `site.contact` = { email: chemicals@goodbizglobal.com, whatsapp/phone: +91 8884799369, address: "Bengaluru, Karnataka, India" }. The footer, Contact page, Organization JSON-LD (`address` with addressLocality Bengaluru, addressRegion Karnataka, addressCountry IN; `contactPoint`) and llms.txt pick it up automatically.
- **Domain move:** the README tells the owner to add `www.goodbizchemicals.com` (with an apex redirect) in Vercel, set `SITE_URL=https://www.goodbizchemicals.com` and redeploy. The code needs no domain hard-coded.

## Decisions from the builder check (my calls unless marked)

- **Required answers per step:**
  - Step 2: a group, or "Something else" with text.
  - Step 3: a product, or "Any / not sure".
  - Step 4: a quantity, or "Another amount" with text. Add a "Not sure yet" quantity pill so it never blocks the buyer. Packaging stays optional.
  - Step 5: country. Port is optional.
  - Step 6: one term. "Not sure" counts.
  - Step 7: optional.
  - Because every step has a "not sure" path, required never means stuck. Next shows an inline error rather than being disabled. The no-JS form marks the same fields `required`.
- **Corrections when going back:** every send carries the full current answer set. A field the buyer has cleared, or that no longer applies, is sent as the explicit marker `"__clear__"`. The Apps Script merge clears that cell. A key that is absent still means "don't touch", and an empty string is still never written over a filled cell. So the row reflects the buyer's final choices: picking "Something else" clears group and product, and a preset quantity cleared by "Another amount" is cleared too.
- **Drop-off measurement:** the Sheet's `stage` column is the funnel. Every step-1 lead is a row, and the stage shows how far the buyer got (`contact`, `product`, `quantity`, `destination`, `terms`, `submitted`). There is no extra analytics, because Vercel custom events need a paid plan. The setup doc includes a ready-made filter view or summary formula that counts rows per stage.
- **`/quote#other`, `?group=other` and the existing "Request a chemical not listed" links:** after step 1, step 2 opens with "Something else" chosen and its text box focused. All existing links stay valid.

## Quality bar

- **Unit tests:**
  - step validation for every step
  - the payload builder (same leadId, cumulative answers, stage values)
  - the sender (keepalive, 15 s timeout, single-flight)
  - pre-fill parsing (scoped, hostile input ignored)
  - fallback message text
- **Apps Script tests:** the script's pure helpers (formula escaping, merge-without-overwrite, row lookup) are written so they can be unit-tested in Node.
- **Browser tests (Playwright):**
  - the contact-first send happens on step 1 Next
  - auto-advance, and back
  - arrow keys don't advance
  - pre-fill skipping from a product page
  - the "Something else" path skips step 3
  - the full flow keeps one leadId across all sends, with the final stage `submitted`
  - double-click sends once
  - failure and timeout show the WhatsApp and email fallback with the request written in
  - the honeypot shows success and sends nothing
  - the no-JS form shows all steps
  - axe has no violations on every step
- **Device check:** the form is checked in a browser at phone width (375) and desktop width before it counts as done.
- **Deploying:** nothing is pushed to `main` (which auto-deploys) without the owner's go-ahead.

## Left to the builder

- Component structure, state management and file layout.
- The group illustrations (simple, on-brand SVGs).
- Exact copy for errors and the success message, following the tone of the existing site.
