# Goodbiz Chem website — design

Date: 2026-10-19
Status: approved by owner 2026-10-19

## Intent

Goodbiz Chem exports industrial chemicals across India and to buyers around the world. The site exists so that a buyer who finds Goodbiz Chem through Google or an AI assistant can quickly understand who the company is and what it supplies, then send a quote request.

Success: buyers find a product page from search, trust what they see, and submit a quote request that lands in a Google Sheet the team can act on.

## Goals

- A clean, professional website that is easy to navigate on both phone and desktop.
- A home page that introduces Goodbiz Chem, shows the product range, and leads to a quote request.
- One page per product, rich enough to rank in search and to be quoted by AI assistants.
- A blog with a few starter posts at launch.
- Strong SEO (search engines), GEO (generative engines, such as ChatGPT and Perplexity) and AEO (answer engines, such as featured snippets and voice answers).
- A quote request form whose submissions are saved as rows in a Google Sheet.

## Non-goals (for now)

- CRM integration. It comes later, replacing the Google Sheet step.
- A blog admin screen or CMS. The publishing method will be decided later.
- Real contact details, address, certifications, years in business, export countries, or similar claims. The owner will supply these later.
- Prices, a shopping cart, accounts or login.
- Multiple languages. The site is English only.

## Anti-goals (failure even if it works)

- Looking AI-generated or templated: generic gradients, stock "hero, 3 features, CTA" rhythm, filler copy.
- Any factual claim the company hasn't made. This covers certifications, years, volumes, countries served, purity guarantees, and statements that Goodbiz Chem's products comply with regulations (REACH, GHS and so on). Product facts must be general and accurate chemistry, never supplier-specific promises.
  - General hazard facts are allowed and expected (my call). For example: methanol is flammable and toxic, caustic soda is corrosive. These describe the chemical, not the company, and buyers need them.
  - Every product page says an SDS is available on request.
  - The NPE page neutrally notes that NPE is restricted in some markets, such as the EU, and that buyers should check their local rules.
- A heavy 3D scene that makes phones slow, delays the page, or hides the content.
- Product pages that are thin or near-duplicates of each other.

## Constraints and decisions made with the owner

- **Company name:** Goodbiz Chem.
- **Stack:** Node.js plus Three.js (owner's request). Deployed on Vercel to the owner's existing domain. Next.js is my call as the Node.js framework, because it fits Vercel and supports static pages.
- **Design skills:** the owner asked that the design work use **Hallmark**, **ui-ux-pro-max** (updated to 2.15.0), and **Emil Kowalski's design-engineering skill** (`emil-design-eng`). Overall feel: clean and professional.
- **Quote requests** go to a Google Sheet, one row per request. The save step must sit behind one small, swappable module so a CRM can replace it later without touching the pages.
- **Blog:** I write a few starter posts. The upload method is decided later.
- **Contact details:** placeholders, kept in one config file so they can be filled in once.

## Products

Every product gets its own page, so all 19 get one. SLES 70% and SLES 28% are separate pages even though they share an HSN code (my call). The codes are shown exactly as the owner gave them: some have 8 digits and some have 6.

| Product | HSN code | Group |
|---|---|---|
| Ethyl Acetate | 29153100 | Solvents |
| Methanol | 29051100 | Solvents |
| IPA (Isopropyl Alcohol) | 29051220 | Solvents |
| DCM / Methylene Chloride | 29031200 | Solvents |
| Toluene | 29023000 | Solvents |
| N-Heptane and Hexane | 29011000 | Solvents |
| Diisopropylamine | 29211990 | Amines |
| Titanium Dioxide | 282300 | Inorganics |
| Caustic Soda (solid) | 281511 | Inorganics |
| Liquid Caustic Soda | 281512 | Inorganics |
| Copper Sulphate | 283325 | Inorganics |
| LABSA | 340231 | Surfactants |
| SLES 70% | 340239 | Surfactants |
| SLES 28% | 340239 | Surfactants |
| SLS / Sodium Lauryl Sulphate | 340239 | Surfactants |
| Alpha Olefin Sulphonate (AOS) | 340239 | Surfactants |
| Sodium Lauryl Sulphoacetate | 340239 | Surfactants |
| Alcohol Ethoxylates | 340242 | Surfactants |
| Nonylphenol Ethoxylates (NPE) | 340242 | Surfactants |

N-Heptane and Hexane stay on one page because the owner listed them together under one code (my call).

The grouping is my call. It drives navigation and filtering.

## Owner changes after first review (2026-10-19)

These supersede anything above that conflicts with them.

- **No product counts in visible copy.** Pages never tell visitors how many products there are, either in total or per group. A result count after the visitor searches or filters is fine.
- **Sourcing unlisted chemicals.** The owner states that Goodbiz Chem can source and supply chemicals that are not on the list. The site says this on home (in a callout and the FAQ), /products, product pages, About and llms.txt.
- **"Other chemical" on the quote form.** The quote form has an optional "Other chemical" field. A request needs either a listed product or that field. It is saved to Sheet column N.
- **No physical form on product pages.** Product pages no longer show the product's physical form. The data field stays, for internal use only.

## Pages

1. **Home:** who Goodbiz Chem is (in neutral wording, no invented claims), the product range grouped and searchable by name or HSN code, how ordering and export works in general terms, an FAQ, a quote request call to action, and a short list of the latest blog posts.
2. **Products index:** every product, filterable by group and searchable by name or HSN code.
3. **Product page (one per product):** name, HSN code, group, common synonyms and CAS number, typical applications and industries, typical packaging options in general terms, general handling and storage notes, an FAQ, related products, and a quote request form with this product already selected.
4. **Blog index and blog post pages:** 3–5 starter posts, for example a guide to HSN codes for chemical exports, SLES 70% vs 28%, solvent selection, and LABSA in detergents. The topics are my call.
5. **Request a Quote:** the standalone form.
6. **About** and **Contact:** placeholder text where the owner has not supplied facts.
7. **404 page.**

## Quote request form

Fields: name, company, email, phone/WhatsApp, country, product(s) (multi-select), quantity with unit, packaging preference, destination port, and message. The owner has not objected to this list.

- Required fields are my call: name, email, country, product, and quantity.
- Validated on both the browser and the server, with spam protection (a honeypot field plus a rate limit; my call).
- Saved to a Google Sheet through a server function, using a Google service account. Credentials live only in Vercel environment variables, never in the code.
- A clear success state and a clear failure state, with a fallback contact path for when saving fails.

## SEO / GEO / AEO

- Pages are built statically, with real HTML content.
- A unique title, description, canonical URL and Open Graph/Twitter tags on every page.
- Structured data (JSON-LD): `Organization` and `WebSite` site-wide, `Product` on product pages (no price or offer data), `FAQPage` where FAQs appear, `BreadcrumbList`, and `BlogPosting` on posts.
- `sitemap.xml`, `robots.txt`, and an `llms.txt` file summarising the company and products for AI tools.
- Answer-first copy: each product page opens with a short, direct summary and uses clear question-style headings.
- Internal links between related products, from blog posts to products, and from products to the quote form.
- Core Web Vitals kept in good ranges on mobile.

## Visual direction and 3D

- Clean, professional and calm, built on the three design skills above.
- **Palette (owner's decision):** pastel colours on white, with green shades as the main colour. All text must still meet WCAG AA contrast. Pastel shades are for backgrounds and accents. Text and buttons use deeper greens.
- **Logo:** there is no existing logo or brand. The builder designs a simple wordmark for Goodbiz Chem that fits the palette (my call). It is used for the favicon, OG images and `Organization` schema.
- Typography and layout structure are left to the builder working through the skills.
- Three.js is used on the home page hero. My guess at the idea is a restrained, slowly rotating molecule or particle structure. It must:
  - load after the main content, so text and the quote button are usable first,
  - fall back to a static image when WebGL is unavailable or the user prefers reduced motion,
  - lower its quality or pause on low-power devices and when it scrolls off-screen.
- Motion follows Emil Kowalski's principles: purposeful, short, and interruptible.

## Working process (owner's decisions)

- **No deploying until the owner explicitly says so.** No Vercel deploys, no preview deploys, no domain changes.
- **Design is iterated in a local browser until it is right.** Every page is checked at phone and desktop widths with screenshots, fixed, and checked again, before it counts as done. The owner reviews in the browser along the way.

## Open, decided later

- **Quote alerts:** whether the team gets an email or WhatsApp alert for new quote requests. For now requests only go into the Sheet. The save module should make adding an alert easy.
- **Domain and existing site:** the domain is supplied at deploy time. If an old site exists on it, redirects are planned then.

## Launch and setup (my calls)

- **Search indexing switch.** One environment variable controls whether search engines may index the site, and it is off by default. While it's off, the site sends `noindex` and `robots.txt` blocks crawlers. The owner turns it on once the real contact details are filled in. This keeps placeholder data out of Google and AI tools.
- **Site address.** The domain is read from one config value (`SITE_URL`). Canonicals, the sitemap, Open Graph tags and `llms.txt` all use it.
- **Placeholder contact details.** `Organization` JSON-LD and `llms.txt` include contact fields only once they are filled in.
- **Third-party setup.** The owner creates the Google service account and the Sheet. The builder writes step-by-step setup instructions in the README.
- **Spam protection.** It uses no extra paid service: a honeypot field, a minimum time to fill the form, a best-effort rate limit inside the function, and server-side validation.
- **Analytics.** Vercel Web Analytics, which is cookieless, so no consent banner is needed. The README includes Google Search Console setup steps.

## Left to the builder

- Exact visual design (palette, type, layout) within the skills and brief above.
- Folder structure, component breakdown, and content format for products and posts (for example Markdown or MDX).
- The wording of product and blog content, kept general and accurate.
- The 3D concept, within the constraints above.
- Testing approach. Playwright is installed and available for end-to-end and visual checks.
