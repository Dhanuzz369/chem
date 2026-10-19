# Goodbiz Chem Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Goodbiz Chem chemicals-export website. It has a home page with a Three.js hero, 19 product pages, a blog, and a quote form that saves to Google Sheets. Every page carries full SEO, GEO and AEO markup, and the site is checked locally in a browser until the owner approves it.

**Architecture:** A Next.js App Router site. All content pages are built statically. Product data lives in one typed TypeScript module and blog posts live as Markdown files. Quote submissions go to one route handler that saves through a swappable `QuoteStore` interface, with Google Sheets as the first implementation. SEO helpers (metadata, JSON-LD, sitemap, robots, llms.txt) all read one site config that holds `SITE_URL` and the indexing switch.

**Tech Stack:** Node 24, Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, Three.js 0.186 (plain `three`, no react-three-fiber), zod 4, google-auth-library 11, gray-matter + marked, Vitest 5, Playwright 1.64 + @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-goodbiz-chem-website-design.md`

## Global Constraints

- **Company name:** "Goodbiz Chem". Do not use any other spelling.
- **No deploying.** No `vercel` commands of any kind, no preview deploys, no domain changes, until the owner explicitly says to deploy.
- **No invented claims.** No certifications, years in business, volumes, countries served, purity guarantees, or statements that Goodbiz Chem's products comply with regulations.
  - General hazard facts about a chemical are allowed.
  - Every product page says "SDS available on request".
- **Placeholders.** Contact details stay empty in `src/config/site.ts` until the owner fills them in. The UI and JSON-LD omit empty fields; they never show fake values.
- **Palette:** pastel colours on white, with green shades as the main colour. Pastels are for backgrounds and accents. Text and buttons use deeper greens. All text meets WCAG AA contrast (4.5:1 for body text, 3:1 for large text).
- **Design skills.** All visual work goes through the `hallmark`, `ui-ux-pro-max:ui-ux-pro-max` and `emil-design-eng` skills. Invoke them before any visual step.
- **English only.** There is no price, cart or login anywhere.
- **Indexing is off by default.** It turns on only when `ALLOW_INDEXING === "true"`.
- **Site address.** Every absolute URL comes from `SITE_URL`, which defaults to `http://localhost:3000`.
- **Credentials.** They live only in environment variables, never in code. `.env.local` is gitignored, and `.env.example` lists the variable names only.
- **HSN codes** are shown exactly as given, as strings, never as numbers.
- **Browser checks.** Every page is checked at 375px and 1440px widths in the browser pane, and it is only done once both screenshots look right.

## Review Focus

1. **Product names with `%`, `/` and `()`.** For example "SLES 70%" or "DCM / Methylene Chloride". Their slugs must be clean ASCII, and both SLES pages must resolve separately. → Task 3 test `slugs are url-safe and unique`. Task 7 e2e test `both SLES pages render`.
2. **Google Sheets env vars missing or wrong when the form is submitted.** The API must return 500 with `save_failed`, and the UI must show the fallback contact message instead of crashing or hanging. → Task 5 test `returns 500 save_failed when store throws`. Task 6 e2e test `shows fallback on server error`.
3. **WebGL unavailable or `prefers-reduced-motion: reduce`.** The hero must show the static image and stay fully usable. → Task 8 e2e test `reduced motion shows static hero`.
4. **`ALLOW_INDEXING` unset in a production build.** Every page must send `noindex` and `robots.txt` must disallow all crawlers. → Task 4 tests `robots disallows when indexing off` and `metadata robots noindex when indexing off`.
5. **Searching by a partial HSN code or by lowercase.** For example "3402" must return all eight 3402xx surfactants, and "sles" must return both SLES products. → Task 3 test `searchProducts matches partial HSN and case-insensitive name`.

---

## File Structure

```
.claude/launch.json                 dev server config for the browser pane
.env.example                        env var names only
README.md                           setup, Sheets, env, indexing switch, Search Console
content/blog/*.md                   starter posts (frontmatter + Markdown)
docs/design/direction.md            chosen design direction (from the skills)
public/hero-fallback.webp           static hero image
public/og-default.png               default social image
src/config/site.ts                  site config, SITE_URL, indexing switch, contact placeholders
src/content/products.ts             19 products: data + query helpers
src/lib/seo/metadata.ts             buildMetadata()
src/lib/seo/jsonld.ts               JSON-LD builders
src/components/JsonLd.tsx           <script type="application/ld+json">
src/lib/blog.ts                     getAllPosts(), getPost()
src/lib/quote/schema.ts             zod schema shared by client + server
src/lib/quote/store.ts              QuoteStore interface + getQuoteStore()
src/lib/quote/sheets-store.ts       Google Sheets implementation
src/lib/quote/guard.ts              honeypot, min-time, rate limit
src/app/api/quote/route.ts          POST handler
src/app/layout.tsx, globals.css     shell, fonts, tokens
src/app/page.tsx                    home
src/app/products/page.tsx           products index
src/app/products/[slug]/page.tsx    product page
src/app/blog/page.tsx, [slug]/page.tsx
src/app/quote/page.tsx, about/page.tsx, contact/page.tsx, not-found.tsx
src/app/sitemap.ts, robots.ts, llms.txt/route.ts, icon.svg
src/components/                     Header, Footer, Logo, Button, Container, ProductCard,
                                    ProductFinder, QuoteForm, FaqList, Breadcrumbs, Hero, HeroScene
tests/unit/*.test.ts                Vitest
tests/e2e/*.spec.ts                 Playwright
```

---

### Task 1: Project scaffold and site config

**Files:**
- Create: the Next.js project in `/Users/dhanush/goodbiz-chem` (keep `docs/`), plus `.claude/launch.json`, `.env.example`, `vitest.config.ts`, `playwright.config.ts`, `src/config/site.ts`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Produces:
  - `type Contact = { email?: string; phone?: string; whatsapp?: string; address?: string }`
  - `const site: { name: "Goodbiz Chem"; tagline: string; contact: Contact }`
  - `getSiteUrl(env?: NodeJS.ProcessEnv): string`: no trailing slash; defaults to `http://localhost:3000`
  - `isIndexingAllowed(env?: NodeJS.ProcessEnv): boolean`
  - `absoluteUrl(path: string): string`

- [ ] **Step 1:** Run `git init`. Scaffold with `npx create-next-app@16 . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --yes`. Move `docs/` aside first if the tool refuses a non-empty directory, then move it back. Install the dev dependencies `vitest @vitejs/plugin-react vite-tsconfig-paths @playwright/test @axe-core/playwright`. Add the npm scripts `test` (`vitest run`) and `e2e` (`playwright test`). In `playwright.config.ts`, set `webServer` to run `npm run build && npm run start` on port 3000, and use two projects: `mobile` (375×812) and `desktop` (1440×900).
- [ ] **Step 2:** Write `.claude/launch.json` with the config `{ "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run","dev"], "port": 3000 }`. Write `.env.example` with these names: `SITE_URL`, `ALLOW_INDEXING`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE`.
- [ ] **Step 3: Write the failing test** `tests/unit/site.test.ts`:

```ts
expect(getSiteUrl({})).toBe("http://localhost:3000");
expect(getSiteUrl({ SITE_URL: "https://x.com/" })).toBe("https://x.com");
expect(isIndexingAllowed({})).toBe(false);
expect(isIndexingAllowed({ ALLOW_INDEXING: "1" })).toBe(false);
expect(isIndexingAllowed({ ALLOW_INDEXING: "true" })).toBe(true);
expect(site.name).toBe("Goodbiz Chem");
expect(Object.values(site.contact).filter(Boolean)).toHaveLength(0);
```

- [ ] **Step 4:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 5:** Implement `src/config/site.ts`.
- [ ] **Step 6:** Run `npm test` (expected: PASS) and `npm run build` (expected: build succeeds).
- [ ] **Step 7:** Commit: `chore: scaffold Next.js app with site config`.

### Task 2: Design direction, tokens, logo and the site shell

**Files:**
- Create: `docs/design/direction.md`, `src/components/{Logo,Header,Footer,Container,Button}.tsx`, `src/app/icon.svg`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `tests/e2e/shell.spec.ts`

**Interfaces:**
- Produces:
  - `<Container>`
  - `<Button href? variant="primary"|"secondary"|"ghost" size="md"|"lg">`
  - `<Logo className?>`: an SVG wordmark with an `aria-label` of "Goodbiz Chem"
  - `<Header>`: links to Products, Blog, About, Contact, and a primary "Request a quote" button pointing to `/quote`
  - `<Footer>`
  - CSS tokens as Tailwind 4 `@theme` variables: `--color-bg`, `--color-surface`, `--color-ink`, `--color-ink-muted`, `--color-brand-50…900` (greens), `--color-accent-*` (pastels), `--font-display`, `--font-body`, `--radius-*`, `--ease-out`

- [ ] **Step 1:** Invoke the `hallmark` skill with this brief: Goodbiz Chem, a B2B chemicals exporter for global buyers, clean and professional, pastel colours on white with green shades, no invented claims. Invoke `ui-ux-pro-max:ui-ux-pro-max` to get palette, font-pairing and B2B landing UX guidance for the Next.js + Tailwind stack. Invoke `emil-design-eng` for the component and motion rules. Record the chosen macrostructure, the type pairing (via `next/font`), the exact token hex values with their contrast ratios, the motion rules, and the reasons in `docs/design/direction.md`.
- [ ] **Step 2: Write the failing e2e test** `tests/e2e/shell.spec.ts`:
  - `header shows logo and quote CTA`: the "Goodbiz Chem" logo link and the "Request a quote" link are visible on both projects.
  - `mobile menu opens, traps focus, closes on Escape`: mobile only. Clicking the button labelled "Menu" opens a navigation containing "Products". Pressing Escape closes it and returns focus to the menu button.
  - `no axe violations on shell`: `AxeBuilder` on `/` returns 0 violations.
- [ ] **Step 3:** Run `npm run e2e -- shell`. Expected: FAIL.
- [ ] **Step 4:** Implement the tokens, the fonts, `Logo` (also exported as `icon.svg`), `Header` (sticky; a mobile disclosure menu with a 44px minimum touch target), `Footer` (product groups, quick links, "SDS available on request", and contact details only where they are filled in), `Button` and `Container`, all following `direction.md`.
- [ ] **Step 5:** Run `npm run e2e -- shell`. Expected: PASS.
- [ ] **Step 6: Visual check.** Start the `dev` preview. Screenshot `/` at 375px and 1440px in the browser pane. Compare against `direction.md` and Hallmark's slop test, fix what is off, and repeat until both widths look right.
- [ ] **Step 7:** Commit: `feat: design tokens, logo and site shell`.
- [ ] **Step 8: Owner checkpoint.** Show the owner the shell in the browser pane and get a go-ahead on the look before continuing.

### Task 3: Product catalogue data

**Files:**
- Create: `src/content/products.ts`
- Test: `tests/unit/products.test.ts`

**Interfaces:**
- Produces:
  - `type ProductGroup = "Solvents" | "Amines" | "Inorganics" | "Surfactants"`
  - `interface Faq { q: string; a: string }`
  - `interface Product { slug; name; hsn: string; group: ProductGroup; cas: string[]; synonyms: string[]; summary: string; applications: string[]; industries: string[]; form: string; packaging: string[]; handling: string[]; hazards: string[]; faqs: Faq[]; related: string[]; notes?: string[] }`
  - `products: Product[]`
  - `getProduct(slug: string): Product | undefined`
  - `productGroups: ProductGroup[]`, in the order Solvents, Amines, Inorganics, Surfactants
  - `searchProducts(query: string, group?: ProductGroup): Product[]`

The slugs are fixed, in the spec's table order: `ethyl-acetate, methanol, isopropyl-alcohol, methylene-chloride, toluene, n-heptane-hexane, diisopropylamine, titanium-dioxide, caustic-soda-flakes, liquid-caustic-soda, copper-sulphate, labsa, sles-70, sles-28, sodium-lauryl-sulphate, alpha-olefin-sulphonate, sodium-lauryl-sulphoacetate, alcohol-ethoxylates, nonylphenol-ethoxylates`.

Names, HSN codes and groups are copied from the spec table. The content is general, accurate chemistry. Write it with care: these are the pages that rank in search.

- [ ] **Step 1: Write the failing test** `tests/unit/products.test.ts`:
  - `has 19 products with spec HSN codes`: a table of the 19 `[slug, hsn, group]` triples from the spec, each checked with `toEqual`.
  - `slugs are url-safe and unique`: every slug matches `/^[a-z0-9-]+$/`, and there are 19 unique slugs.
  - `every product is substantive`: `summary` is 120–320 characters; there are at least 3 `applications`, at least 4 `faqs`, at least 2 `handling` items and at least 1 `hazards` item; and `related` contains only valid slugs.
  - `no near-duplicate summaries`: summaries are pairwise distinct.
  - `npe notes EU restriction`: `getProduct("nonylphenol-ethoxylates")!.notes!.join(" ")` matches `/EU/`.
  - `no invented claims`: no text field matches `/certified|ISO \d|since \d{4}|years of experience|REACH[- ]compliant|guarantee/i`.
  - `searchProducts matches partial HSN and case-insensitive name`:
    - `searchProducts("3402").length === 8`
    - `searchProducts("sles").map(p => p.slug)` contains `sles-70` and `sles-28`
    - `searchProducts("", "Amines")` returns `["diisopropylamine"]`
    - `searchProducts("methylene")` finds DCM through its synonyms
- [ ] **Step 2:** Run `npm test -- products`. Expected: FAIL.
- [ ] **Step 3:** Implement `products.ts`. Search matches against name, synonyms, HSN prefix and CAS, ignoring case.
- [ ] **Step 4:** Run `npm test -- products`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: product catalogue data for 19 products`.

### Task 4: SEO foundation (metadata, JSON-LD, sitemap, robots, llms.txt)

**Files:**
- Create: `src/lib/seo/metadata.ts`, `src/lib/seo/jsonld.ts`, `src/components/JsonLd.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/llms.txt/route.ts`, `public/og-default.png`
- Modify: `src/app/layout.tsx` (site-wide Organization and WebSite JSON-LD, default metadata, `@vercel/analytics`)
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: `site`, `getSiteUrl`, `isIndexingAllowed`, `absoluteUrl` (Task 1); `products`, `Product`, `Faq` (Task 3)
- Produces:
  - `buildMetadata(o: { title: string; description: string; path: string; image?: string; type?: "website" | "article" }): Metadata`. It sets canonical, OG, Twitter and `robots: { index, follow }` from `isIndexingAllowed()`.
  - `organizationJsonLd()`, `websiteJsonLd()`, `productJsonLd(p: Product)`, `faqJsonLd(faqs: Faq[])`, `breadcrumbJsonLd(items: { name: string; path: string }[])`: each returns a plain object. `organizationJsonLd()` includes `logo` (an absolute URL to `/icon.svg`). `blogPostingJsonLd` is added in Task 9.
  - `<JsonLd data={object | object[]} />`
  - `sitemap()` accepts extra entries from `getAllPosts()` once Task 9 exists. Until then, it lists static routes and products.

- [ ] **Step 1: Write the failing test** `tests/unit/seo.test.ts`:
  - `metadata canonical uses SITE_URL`: with `SITE_URL=https://ex.com`, `buildMetadata({title:"T",description:"D",path:"/products/methanol"}).alternates.canonical` is `"https://ex.com/products/methanol"`.
  - `metadata robots noindex when indexing off`: `robots.index === false`.
  - `productJsonLd has no offers and includes HSN`: there is no `offers` key, and `additionalProperty` contains `{ name: "HSN code", value: "29051100" }` for methanol.
  - `organizationJsonLd omits empty contact`: there is no `contactPoint`, `email` or `telephone` key while `site.contact` is empty, `name` is "Goodbiz Chem", and `logo` ends with `/icon.svg`.
  - `faqJsonLd shape`: `@type` is `FAQPage`, and `mainEntity.length` equals the number of FAQs passed in.
  - `robots disallows when indexing off`: `robots().rules` disallows `/`. With `ALLOW_INDEXING=true` it allows `/` and includes the `sitemap` URL.
  - `sitemap lists every product`: it contains all 19 `/products/<slug>` URLs.
  - `llms.txt lists products with HSN`: a `GET` on the route returns text containing "Goodbiz Chem" and every product name with its HSN code.
- [ ] **Step 2:** Run `npm test -- seo`. Expected: FAIL.
- [ ] **Step 3:** Implement all of the above. `llms.txt` follows the llmstxt.org format: an H1 with the name, a blockquote summary, a `## Products` list linking each product page with its HSN code, and `## Pages`.
- [ ] **Step 4:** Run `npm test -- seo`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: SEO metadata, JSON-LD, sitemap, robots and llms.txt`.

### Task 5: Quote API (schema, spam guard, swappable store)

**Files:**
- Create: `src/lib/quote/schema.ts`, `src/lib/quote/store.ts`, `src/lib/quote/sheets-store.ts`, `src/lib/quote/guard.ts`, `src/app/api/quote/route.ts`
- Test: `tests/unit/quote.test.ts`

**Interfaces:**
- Consumes: `products` (Task 3), to validate product slugs
- Produces:
  - `quoteSchema` (zod). Required: `name` (2–100 chars), `email` (email), `country` (2–60), `products` (an array of valid slugs, 1–19 items), `quantity` (1–40), `quantityUnit` (`"kg" | "MT" | "L" | "KL" | "drums" | "IBC" | "containers"`). Optional: `company`, `phone`, `packaging`, `port`, `message` (up to 2000 characters). Guard fields: `website` (the honeypot, which must be empty) and `startedAt` (an epoch in ms).
  - `type QuoteInput = z.infer<typeof quoteSchema>`
  - `type QuoteRecord = Omit<QuoteInput, "website" | "startedAt"> & { submittedAt: string; source: string }`
  - `interface QuoteStore { save(r: QuoteRecord): Promise<void> }`
  - `getQuoteStore(): QuoteStore`: returns the Sheets store. A test override goes through `setQuoteStoreForTests(s)`.
  - `createSheetsStore(env)`: appends one row to `GOOGLE_SHEET_RANGE` (default `Quotes!A:M`) through the Sheets REST `values:append` call, authenticated with a google-auth-library `JWT`. It throws when an env var is missing. The column order is: `submittedAt, name, company, email, phone, country, products (comma-joined names), quantity, quantityUnit, packaging, port, message, source`.
  - `isSpam(input, now: number): boolean`: true when the honeypot is filled or the form took less than 3000 ms.
  - `rateLimit(key: string, now: number): boolean`: an in-memory limit of 5 per 10 minutes per key, best-effort.
  - `POST /api/quote` responds with:
    - `200 {ok:true}`
    - `400 {ok:false, error:"invalid", fields: Record<string,string>}`
    - `429 {ok:false, error:"rate_limited"}`
    - `500 {ok:false, error:"save_failed"}`
    - Spam gets `200 {ok:true}` but is not saved.

- [ ] **Step 1: Write the failing test** `tests/unit/quote.test.ts`, calling the route's `POST` with a fake store:
  - `saves valid request`: returns 200, the store gets 1 record, and `record.products` equals `["methanol"]`.
  - `rejects missing required fields`: returns 400, and `fields` has the keys `name`, `email`, `country`, `products` and `quantity`.
  - `rejects unknown product slug`: returns 400.
  - `honeypot is silently dropped`: returns 200, and the store gets 0 records.
  - `too-fast submit is silently dropped`: when `startedAt` is now − 500 ms, the store gets 0 records.
  - `rate limits sixth request from same ip`: returns 429.
  - `returns 500 save_failed when store throws`.
  - `sheets store throws on missing env`: `createSheetsStore({}).save(r)` rejects with a message naming `GOOGLE_SHEET_ID`.
- [ ] **Step 2:** Run `npm test -- quote`. Expected: FAIL.
- [ ] **Step 3:** Implement the files. The route reads the client IP from the `x-forwarded-for` header for the rate limit, and logs server errors without logging personal data.
- [ ] **Step 4:** Run `npm test -- quote`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: quote API with spam guard and Google Sheets store`.

### Task 6: Quote form UI and the /quote page

**Files:**
- Create: `src/components/QuoteForm.tsx` (client component), `src/app/quote/page.tsx`
- Test: `tests/e2e/quote.spec.ts`

**Interfaces:**
- Consumes: `quoteSchema` (Task 5), `products`, `site.contact`
- Produces: `<QuoteForm defaultProducts?: string[] compact?: boolean />`. It reads `?product=<slug>` on `/quote` to preselect a product.

- [ ] **Step 1: Write the failing e2e test** `tests/e2e/quote.spec.ts`. It stubs `/api/quote` with `page.route`:
  - `prefills product from query`: on `/quote?product=toluene`, the product field shows Toluene as selected.
  - `shows inline errors on empty submit`: errors appear next to Name, Email, Country, Product and Quantity, and focus moves to the first invalid field.
  - `submits and shows success`: the stub returns 200. A success message containing "Thank you" appears, and the request body contains `"products":["toluene"]`.
  - `shows fallback on server error`: the stub returns 500. A message appears saying the request was not sent and asking the user to try again or contact the team. The form keeps the values entered.
  - `no axe violations on /quote`.
- [ ] **Step 2:** Run `npm run e2e -- quote`. Expected: FAIL.
- [ ] **Step 3:** Implement the form, using `ui-ux-pro-max` form guidance and `emil-design-eng`. Requirements:
  - Labels sit above the fields, with the right input types: `email`, and `tel` with `autocomplete`.
  - The product multi-select is keyboard-accessible and searchable.
  - Validation runs on blur and on submit, using the same zod schema as the server.
  - The submit button shows a pending state and is disabled while sending.
  - The honeypot is a hidden `website` field, and `startedAt` is set on mount.
  - Inputs use a 16px font on mobile so the page doesn't zoom.
- [ ] **Step 4:** Run `npm run e2e -- quote`. Expected: PASS.
- [ ] **Step 5:** Run the visual check on `/quote` at 375px and 1440px, covering the error, success and failure states. Fix and repeat until they look right.
- [ ] **Step 6:** Commit: `feat: quote form and quote page`.

### Task 7: Products index and product pages

**Files:**
- Create: `src/components/{ProductCard,ProductFinder,FaqList,Breadcrumbs}.tsx`, `src/app/products/page.tsx`, `src/app/products/[slug]/page.tsx`
- Test: `tests/e2e/products.spec.ts`

**Interfaces:**
- Consumes: Tasks 3, 4 and 6
- Produces:
  - `<ProductFinder initialGroup?>`: a client component with group filter chips and a search input that calls `searchProducts`. It is used on `/products` and on home.
  - `<FaqList faqs>`: rendered with `<details>`, using the FAQs as question headings.
  - `<Breadcrumbs items>`

- [ ] **Step 1: Write the failing e2e test** `tests/e2e/products.spec.ts`:
  - `index lists 19 products`: `/products` shows 19 product cards.
  - `filter and search`: clicking "Surfactants" shows 8 cards, and typing "3402" shows 8 cards.
  - `both SLES pages render`: `/products/sles-70` has an h1 containing "SLES 70%", `/products/sles-28` has an h1 containing "SLES 28%", and both show "340239".
  - `product page has answer-first summary, HSN, SDS note, FAQ, related links and prefilled form`: checked on `/products/methanol`.
  - `product JSON-LD present`: the page has `script[type="application/ld+json"]` blocks containing `"@type":"Product"`, `"FAQPage"` and `"BreadcrumbList"`.
  - `unknown slug 404s`: `/products/nope` returns status 404.
  - `no axe violations` on `/products` and `/products/methanol`.
- [ ] **Step 2:** Run `npm run e2e -- products`. Expected: FAIL.
- [ ] **Step 3:** Implement the pages. Requirements:
  - Use `generateStaticParams` over all slugs and `dynamicParams = false`.
  - Metadata comes from `buildMetadata`. The title pattern is `"<Name> (HSN <code>) Exporter | Goodbiz Chem"`.
  - Page order:
    1. h1 and a one-paragraph summary
    2. key facts (HSN, CAS, group, form)
    3. applications and industries
    4. packaging
    5. handling and hazards, plus "SDS available on request"
    6. notes
    7. FAQ
    8. related products
    9. a compact `QuoteForm` preselected with this product
  - On mobile there is a sticky "Request a quote" bar.
- [ ] **Step 4:** Run `npm run e2e -- products`. Expected: PASS.
- [ ] **Step 5:** Run the visual check on `/products`, `/products/methanol` and `/products/sles-70` at both widths. Fix and repeat.
- [ ] **Step 6:** Commit: `feat: products index and 19 product pages`.

### Task 8: Home page and the Three.js hero

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/HeroScene.tsx` (a client component that dynamically imports `three`), `public/hero-fallback.webp`
- Modify: `src/app/page.tsx`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `ProductFinder`, `FaqList`, `Button`, `getAllPosts`. Until Task 9, render the latest-posts section only when posts exist.
- Produces: `<HeroScene />` mounts a `<canvas>` only when all four of these hold:
  - WebGL is available
  - `prefers-reduced-motion` is not `reduce`
  - the hero is in view (checked with IntersectionObserver)
  - the browser is idle after first paint (`requestIdleCallback`, falling back to `setTimeout`)

  Otherwise it shows `hero-fallback.webp`. The animation pauses when the hero is off-screen or the tab is hidden, the pixel ratio is capped at 1.5 (1 on low-power devices, judged by `navigator.hardwareConcurrency <= 4`), and everything is disposed on unmount.

- [ ] **Step 1:** Using `hallmark` and `emil-design-eng`, decide the hero concept within `direction.md`. The spec's guess is a restrained, slowly rotating molecule or particle structure in brand greens on a pastel background. Record it in `direction.md`. Generate `hero-fallback.webp` by screenshotting a rendered frame of the scene.
- [ ] **Step 2: Write the failing e2e test** `tests/e2e/home.spec.ts`:
  - `h1 and quote CTA usable before 3D`: the h1 and the "Request a quote" button are visible, and the CTA navigates to `/quote`.
  - `reduced motion shows static hero`: with `page.emulateMedia({ reducedMotion: "reduce" })`, there is no `canvas` and the fallback `img` is visible.
  - `canvas mounts with motion allowed`: on desktop, a `canvas` appears within 5 seconds.
  - `home sections present`: these sections are visible: product range (the finder with 19 items), how ordering works, FAQ, and the quote CTA.
  - `home JSON-LD`: `Organization`, `WebSite` and `FAQPage` are present.
  - `no axe violations on /`.
- [ ] **Step 3:** Run `npm run e2e -- home`. Expected: FAIL.
- [ ] **Step 4:** Implement the home page using the macrostructure in `direction.md`. Sections, in order:
  1. hero
  2. who we are (neutral wording, no claims)
  3. product range (`ProductFinder`)
  4. how ordering and export works (enquiry → quote → documentation → dispatch, in general terms)
  5. FAQ
  6. latest posts
  7. closing quote CTA

  Motion follows Emil's rules: short ease-out, only on `transform` and `opacity`, respects reduced motion.
- [ ] **Step 5:** Run `npm run e2e -- home`. Expected: PASS.
- [ ] **Step 6:** Run the visual check on `/` at 375px and 1440px, and also scroll the full page and screenshot each section. Fix and repeat. Check in DevTools (the `javascript_tool` frame-time probe) that the scene keeps frames under 16 ms on desktop.
- [ ] **Step 7:** Commit: `feat: home page with Three.js hero`.
- [ ] **Step 8: Owner checkpoint.** Walk the owner through the home and product pages in the browser pane, then apply their feedback before continuing.

### Task 9: Blog with starter posts

**Files:**
- Create: `src/lib/blog.ts`, `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, and four posts in `content/blog/`:
  - `hsn-codes-for-chemical-exports.md`
  - `sles-70-vs-sles-28.md`
  - `choosing-an-industrial-solvent.md`
  - `labsa-in-detergent-manufacturing.md`
- Modify: `src/app/sitemap.ts` (add the posts), `src/lib/seo/jsonld.ts` (add `blogPostingJsonLd(post: PostMeta)`)
- Test: `tests/unit/blog.test.ts`, `tests/e2e/blog.spec.ts`

**Interfaces:**
- Consumes: `buildMetadata` and `JsonLd` (Task 4); `getProduct` (Task 3)
- Produces:
  - `interface PostMeta { slug; title; description; date: string /* ISO */; products: string[] /* product slugs */ }`
  - `interface Post extends PostMeta { html: string; readingMinutes: number }`
  - `getAllPosts(): PostMeta[]`: sorted newest first
  - `getPost(slug: string): Post | null`

- [ ] **Step 1: Write the failing tests.**
  - `tests/unit/blog.test.ts`:
    - `loads 4 posts sorted by date desc`
    - `every post links only real products`: each `products` slug resolves through `getProduct`
    - `every post has a description of 70–160 characters`
    - `no invented claims`: uses the same regex as Task 3
  - `tests/e2e/blog.spec.ts`:
    - `index lists posts`
    - `post renders with BlogPosting JSON-LD and links to its products`
    - `sitemap includes posts`
    - `no axe violations`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement the loader. It uses `gray-matter` and `marked`, and the post files are trusted local content. Implement the pages too. Each post page has a question-style h2 structure, answer-first opening paragraphs, a "Products in this article" block, and a quote CTA. Write the four posts at 700–1200 words each, accurate and general, linking to the relevant product pages.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Run the visual check on `/blog` and one post at both widths.
- [ ] **Step 6:** Commit: `feat: blog with four starter posts`.

### Task 10: About, Contact and 404 pages

**Files:**
- Create: `src/app/about/page.tsx`, `src/app/contact/page.tsx`, `src/app/not-found.tsx`
- Test: `tests/e2e/pages.spec.ts`

- [ ] **Step 1: Write the failing e2e test.**
  - `about renders without claims`: the page text doesn't match the Task 3 claims regex.
  - `contact shows quote form and hides empty contact fields`: no `mailto:` or `tel:` links appear while the contact config is empty.
  - `404 page offers products and quote links`: checked on `/does-not-exist`.
  - `no axe violations`.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3:** Implement the pages. About uses neutral copy about what Goodbiz Chem supplies and how it works with buyers. Contact embeds `QuoteForm` and renders each contact field only when it is set.
- [ ] **Step 4:** Run the test (expected: PASS), then the visual check at both widths.
- [ ] **Step 5:** Commit: `feat: about, contact and 404 pages`.

### Task 11: Full-site polish, audits and README

**Files:**
- Create: `README.md`, `tests/e2e/seo.spec.ts`
- Modify: whatever the audits turn up

- [ ] **Step 1: Write the e2e test** `tests/e2e/seo.spec.ts`. It visits every route from the sitemap and asserts:
  - exactly one `h1`
  - a unique `<title>` and meta description across all pages
  - a canonical link starting with `SITE_URL`
  - a `noindex` robots meta tag (indexing is off in the test environment)
  - no axe violations
  - no console errors
- [ ] **Step 2:** Run `npm run e2e`. Expected: PASS on both projects. Fix any failure.
- [ ] **Step 3: Polish pass.**
  - Run `hallmark audit` over `src/`, and run `emil-design-eng` and `ui-ux-pro-max` review checks. Fix every material finding.
  - Re-screenshot every page at 375px, 768px and 1440px. Repeat until nothing looks off.
- [ ] **Step 4: Performance check.** Run `npx lighthouse http://localhost:3000/ --preset=perf --form-factor=mobile --screenEmulation.mobile` and do the same for `/products/methanol`. The targets are LCP < 2.5 s, CLS < 0.1, and TBT < 200 ms. Fix any regressions.
- [ ] **Step 5: Write `README.md`.** It covers:
  - running locally
  - every env var
  - creating the Google service account and Sheet: the steps, plus the header row in the Task 5 column order
  - the `ALLOW_INDEXING` switch and when to turn it on
  - where to fill in contact details (`src/config/site.ts`)
  - how to add a blog post
  - Vercel Web Analytics
  - Google Search Console verification and sitemap submission
  - a clear note that deployment waits for the owner's go-ahead
- [ ] **Step 6:** Run `npm test && npm run e2e && npm run build`. Expected: all green.
- [ ] **Step 7:** Commit: `chore: full-site polish, audits and README`.
- [ ] **Step 8: Owner review.** Present the finished site in the browser pane and iterate on the owner's feedback. **Do not deploy.**
