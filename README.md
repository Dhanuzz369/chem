# Goodbiz Chem website

The Goodbiz Chem website: a product catalogue of industrial chemicals listed by HSN code, a step-by-step quote request form that saves every buyer to a Google Sheet (through a Google Apps Script web app), a blog, and About and Contact pages.

This guide is written for the business owner. You do not need to be a developer to follow it, but a few steps use the Terminal app on a Mac.

> **Nothing is live yet.** The site has not been deployed. Putting it on the internet waits for your go-ahead; see [Going live](#going-live-waits-for-your-go-ahead) at the end.

## Pre-launch checklist

Do these in order. Each step links to the section that explains it.

1. [x] **Contact details** are filled in `src/config/site.ts` (chemicals@goodbizglobal.com, +91 8884799369, Bengaluru). See [section 5](#5-contact-details).
2. [ ] **Set up the leads Sheet** and put its web-app address in `NEXT_PUBLIC_LEADS_ENDPOINT`. See [section 3](#3-quote-requests-the-leads-sheet).
3. [ ] **Move to www.goodbizchemicals.com** and set `SITE_URL=https://www.goodbizchemicals.com`. See [Going live](#going-live-waits-for-your-go-ahead), step 3.
4. [ ] **Deploy**, only once you have given the go-ahead. See [Going live](#going-live-waits-for-your-go-ahead).
5. [ ] **Send a real test quote** from the live site and confirm the row appears in the Sheet.
6. [ ] **Run `npm audit --omit=dev`** in Terminal and deal with anything it reports.
7. [ ] **Only then set `ALLOW_INDEXING=true`** and redeploy. See [section 4](#4-the-allow_indexing-switch).

---

## 1. Run the site on your own computer

You need [Node.js](https://nodejs.org) version 22 or newer (the "LTS" download is fine).

1. Open Terminal and go to the project folder:
   ```
   cd ~/goodbiz-chem
   ```
2. Install the building blocks (only needed the first time, or after an update):
   ```
   npm install
   ```
3. Copy the settings template and fill it in (see [Settings](#2-settings-environment-variables) below):
   ```
   cp .env.example .env.local
   ```
4. Start the site:
   ```
   npm run dev
   ```
5. Open <http://localhost:3000> in your browser. Changes you save to the files appear straight away. Press `Ctrl + C` in Terminal to stop.

Other commands you may hear about:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the quick checks on the product data, blog posts and SEO. |
| `npm run e2e` | Opens the site in a test browser (phone and desktop sizes) and checks every page. It builds the site twice and serves it on ports 3100 and 3101: once with a stand-in quote-form address, once with none, to check the WhatsApp and email fallback. Before the first run, install the test browser once with `npx playwright install chromium`. |
| `npm run build` | Builds the finished site, exactly as it will run when live. |
| `npm run lint` | Checks the code for common mistakes. |

---

## 2. Settings (environment variables)

Settings live in a file called `.env.local` in the project folder on your computer, and in the Vercel dashboard once the site is live. This file holds private keys, so it is never shared or committed. `.env.example` lists every setting with an empty value.

| Setting | What to put in it | Example |
| --- | --- | --- |
| `SITE_URL` | The full web address of the site, without a slash at the end. Used for links in search results, the sitemap and social previews. Leave empty on your computer. After setting or changing it on Vercel, **redeploy** (it is read when the site is built). If `ALLOW_INDEXING` is `true` and `SITE_URL` is empty, the build stops with a message saying so. | `https://www.example.com` |
| `ALLOW_INDEXING` | `true` lets Google list the site. Anything else (including empty) keeps it hidden. See [section 4](#4-the-allow_indexing-switch). | `true` |
| `NEXT_PUBLIC_LEADS_ENDPOINT` | The web-app address (ending in `/exec`) of the leads Sheet's Apps Script. See [section 3](#3-quote-requests-the-leads-sheet). It is not secret: the browser sends quote requests straight to it. It is read when the site is built, so **redeploy** after setting or changing it. While it is empty, the form still works step by step, and at the end it offers to send the request on WhatsApp or by email instead. | `https://script.google.com/macros/s/AKfy…/exec` |
| `GOOGLE_SITE_VERIFICATION` | Optional. The code Google Search Console gives you if you choose the **HTML tag** way of proving you own the site (only the `content="…"` value). Leave empty if you verify with a DNS record instead. Redeploy after setting it. | `abc123XYZ` |
| `BING_SITE_VERIFICATION` | Optional. The code Bing Webmaster Tools gives you for its **meta tag** check (the `content="…"` value of `msvalidate.01`). Redeploy after setting it. | `0123456789ABCDEF` |


---

## 3. Quote requests: the leads Sheet

The quote form asks one small thing per screen. Each buyer becomes **one row** in a Google Sheet in your goodbizglobal.com Workspace: the row is created as soon as they enter their contact details on the first screen, and it is updated as they go. The `stage` column shows how far they got. An alert email goes to chemicals@goodbizglobal.com when a new lead arrives and when a request is completed.

The Sheet is written by a small Google Apps Script web app that you own. Follow **[docs/leads-apps-script.md](docs/leads-apps-script.md)** to set it up (about ten minutes, one time), then put its `/exec` address in `NEXT_PUBLIC_LEADS_ENDPOINT` ([section 2](#2-settings-environment-variables)) and redeploy.

If the address is missing, or a request cannot reach the Sheet, the buyer is never stuck: the form shows **Send on WhatsApp** and **Send by email** buttons with the whole request already written in.

---

## 4. The `ALLOW_INDEXING` switch

While `ALLOW_INDEXING` is anything other than `true`, every page tells search engines "do not list this page" and `robots.txt` blocks crawlers. This keeps a half-finished site out of Google.

**Turn it on (`ALLOW_INDEXING=true`) only when:**

- the real contact details are filled in (see [section 5](#5-contact-details)),
- you have checked the product pages, About page and blog posts and are happy with every statement on them, and
- `SITE_URL` is set to the real domain.

**Important:** changing `ALLOW_INDEXING` (or `SITE_URL`) needs a **rebuild and redeploy** to take effect. `robots.txt`, `sitemap.xml` and `llms.txt` are generated when the site is built, so editing the setting alone changes nothing until the next deployment. On Vercel: change the setting, then open **Deployments** and choose **Redeploy** on the latest one.

---

## 5. Contact details

The contact details live in the `contact` block of `src/config/site.ts`:

```ts
contact: {
  email: "chemicals@goodbizglobal.com",
  phone: "+91 8884799369",
  whatsapp: "+91 8884799369",
  address: "Bengaluru, Karnataka, India",
},
```

They appear on the Contact page, in the footer, in `llms.txt`, in the search-engine data for the company, and in the quote form's WhatsApp and email buttons. Delete a line to stop showing it; anything empty is simply not shown. Phone and WhatsApp numbers should include the country code. The city and state for search engines are in `origin` in the same file.

---

## 6. Adding or editing a product

All products live in one file, `src/content/products.ts`. Each product is one block between `{` and `},` in the `products` list. The product page, the product finder, the quote form's product list, the sitemap and `llms.txt` are all built from it, so there is nothing else to update.

1. Copy an existing product block from the same group and paste it where you want the new product to appear in the list.
2. Change every field. All of these are required:

   | Field | What it is |
   | --- | --- |
   | `slug` | The page address: `/products/<slug>`. Lowercase words and dashes only, and different from every other product. |
   | `name` | The product name as buyers know it. |
   | `hsn` | The HSN code, in quotes, exactly as you use it (6 or 8 digits). It is shown as typed. |
   | `group` | One of `"Solvents"`, `"Amines"`, `"Inorganics"` or `"Surfactants"`. A new group needs a developer. |
   | `cas` | One or more CAS numbers, for example `["67-56-1"]`. |
   | `synonyms` | Other names buyers search for. Can be empty: `[]`. |
   | `summary` | The first paragraph on the page: 120 to 320 characters that say what the chemical is and what it is used for. |
   | `metaSummary` | A short phrase for Google's search snippet (see below). |
   | `applications` | At least 3 uses. |
   | `industries` | The industries that buy it. |
   | `form` | Internal note, not shown on the site: what it looks like and how it behaves, in a sentence or two. Still required in the file (leave a short sentence), and still checked for banned claims. |
   | `packaging` | Common pack types, for example drums or IBCs. |
   | `handling` | At least 2 storage and handling points. |
   | `hazards` | At least 1 general hazard fact about the chemical. |
   | `faqs` | At least 4 questions and answers (`q` and `a`). |
   | `related` | At least 2 other products' `slug`s, for the "Related products" links. Each must match an existing slug exactly, and not the product's own. |
   | `notes` | Optional. Extra points such as market restrictions. |
   | `seoTitle` | Optional. Only for long names: the page title shown in Google, at most 45 characters, with the name, the word "Exporter" and the HSN code. Without it the title is made for you (see below). |

3. **`metaSummary` and the 160-character rule.** Google's snippet is built as `<name> (HSN <hsn>) — <metaSummary>. Exporter from India. SDS available on request.` The whole line must be 160 characters or fewer, so keep `metaSummary` to a short lowercase phrase with no full stop, for example `a water-miscible solvent for disinfectants, cleaning, inks and coatings`. The page title is made the same way: `<name> Exporter & Supplier, HSN <hsn>`, or `<name> Exporter, HSN <hsn>` when the long one does not fit in 60 characters. If even the short one is too long, `npm test` says so; add a `seoTitle`.
4. **No claims.** Write only general facts about the chemical. Do not mention certifications, years in business, volumes, countries served, purity guarantees or regulatory compliance. The checks reject the most common ones.
5. **"SDS available on request"** is added to every product page and snippet automatically.
6. **Run the checks**: `npm test` (and `npm run e2e` if you can). They confirm every field is filled in, slugs are unique, `related` slugs exist, snippets fit in 160 characters and no banned claims slipped in. Then look at the page at `http://localhost:3000/products/<slug>`.

To edit a product, change its fields the same way and run the checks. Changing a `slug` changes the page address, so also update any `related` lists and blog posts that mention it.

---

## 7. Adding a blog post

Posts are plain text files in `content/blog/`. Each file becomes a page at `/blog/<file name>`.

1. Copy an existing post, for example `content/blog/sles-70-vs-sles-28.md`, and rename the copy. The file name becomes the address, so use lowercase words and dashes only: `content/blog/storing-caustic-soda.md`.
2. Edit the block at the top between the `---` lines:
   ```yaml
   ---
   title: "How should you store caustic soda?"
   description: "One or two sentences, 70 to 160 characters, shown in search results."
   date: "2026-11-02"
   products:
     - caustic-soda-flakes
     - liquid-caustic-soda
   ---
   ```
   - `date` is year-month-day and must be a real date.
   - `products` lists product page names exactly as they appear in the address, for example `methanol` for `/products/methanol`. Each of those product pages links back to the post under "Further reading".
   - Optional: `seoTitle: "..."`, a shorter title for Google when `title` is longer than 45 characters. `npm test` tells you when one is needed.
3. Below the second `---`, write the post in [Markdown](https://www.markdownguide.org/basic-syntax/): `## ` starts a section heading, `- ` starts a bullet, `[text](/products/toluene)` makes a link.
4. Start with a short paragraph that answers the title's question, and phrase section headings as questions. The checks (`npm test`) expect 700 to 1,200 words.
5. Do not claim certifications, years in business, volumes, purity guarantees or regulatory compliance unless they are true and you can prove them. The checks reject the most common ones.
6. Run `npm test`, then look at the post at <http://localhost:3000/blog>. It appears on the blog page, on the home page if it is among the newest three, and in the sitemap.

---

## 8. Vercel Web Analytics

The site includes Vercel Web Analytics, which counts visits and page views without cookies or cookie banners. It only runs on Vercel; on your computer it is switched off. It relies on Vercel's default **Automatically expose System Environment Variables** setting (under **Settings** > **Environment Variables**), so leave that switched on. After the site is live, open the project in the Vercel dashboard, go to the **Analytics** tab and click **Enable**. Numbers start appearing after the next deployment.

---

## 9. Google Search Console

Search Console shows how the site appears in Google and lets you ask Google to read it.

1. When the site is live on its real domain and `ALLOW_INDEXING=true` is deployed, go to [Google Search Console](https://search.google.com/search-console) and click **Add property**.
2. Choose **Domain**, type your domain (for example `example.com`) and follow the instructions to add a TXT record at your domain registrar. This proves you own the domain and needs no change to the website.
3. Once verified, open **Sitemaps**, enter `sitemap.xml` and click **Submit**. The sitemap lists every product page, blog post and main page.
4. Use **URL inspection** on the home page and a product page and click **Request indexing** to speed things up.

---

## 10. SEO & AI search

### What the site already does

- **Titles that match buyer searches.** Every product page title reads like "Methanol Exporter & Supplier, HSN 29051100 | Goodbiz Chem", within the 60 characters Google shows. Descriptions start with the name and HSN code and say "Exporter from India".
- **A visible line under each product name**: "Exporter & supplier · HSN code · group", plus a generated question on every product page: "Do you export …?", answered from your own description (you export and supply it; send a quote request).
- **Keywords** for each product, built from its own name, synonyms, HSN code and CAS numbers.
- **Share images.** Every product and blog post has its own preview card (name, HSN code, group) for WhatsApp, LinkedIn, X and search results.
- **Structured data** that Google and AI assistants read: the company (with country India), every product with its HSN and CAS numbers, related products and the articles that mention it, the product list, FAQs, breadcrumbs, articles and a site search box. No prices or ratings are claimed.
- **For AI assistants** (ChatGPT, Perplexity, Gemini, Claude): `/llms.txt` is a short guide to the site and `/llms-full.txt` is the whole catalogue in one plain-text file. Once indexing is on, `robots.txt` names the main AI crawlers and lets them in. That list includes `Google-Extended` and `Applebot-Extended`, which are not search crawlers but signals that Google and Apple may use the site to train their AI models; if you would rather opt out of that, delete those two names from the `AI_CRAWLERS` list in `src/app/robots.ts`, add `{ userAgent: ["Google-Extended", "Applebot-Extended"], disallow: "/" },` to the `rules` list in the same file, and redeploy. Your Google and Apple search listings are not affected.
- **Sitemap** with every page, the product share images and the home page image, plus a web app manifest and the usual technical tags.

None of this guarantees a ranking. Search engines also weigh things outside the website, listed next.

### What only you can do (this matters more than the code)

1. **Turn indexing on** with real contact details filled in ([section 4](#4-the-allow_indexing-switch) and [section 5](#5-contact-details)). Until then Google is told not to list the site.
2. **Verify the site** in [Google Search Console](#9-google-search-console) and in [Bing Webmaster Tools](https://www.bing.com/webmasters) (Bing also feeds ChatGPT search and Copilot), and **submit `sitemap.xml`** in both. If you use the meta-tag method, put the codes in `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` ([section 2](#2-settings-environment-variables)).
3. **Create a Google Business Profile** for the company, with the same name, website and contact details as the site.
4. **Get listed on B2B directories** such as IndiaMART, TradeIndia, Alibaba and ExportersIndia, each linking back to the site. Use the same product names and HSN codes as the site.
5. **Write more blog posts** that answer real buyer questions ("What is the HSN code for …?", "SLES or SLS for shampoo?"). Each post should list the products it covers ([section 7](#7-adding-a-blog-post)).
6. **Keep the product data accurate.** When you change products, also change `SITE_UPDATED` in `src/config/site.ts` to the date, so search engines know to look again.

### Changing the country

The export country is written in one place: `site.origin` in `src/config/site.ts`:

```ts
origin: { country: "India", countryCode: "IN" },
```

Change both values (the code is the two-letter country code), run `npm test`, and every title, description, keyword list, `llms-full.txt` and the structured data follow. `npm test` warns you if a longer country name pushes a description past 160 characters.

---

## Going live (waits for your go-ahead)

The site has **not** been deployed, and nothing in this project deploys it automatically. When you are ready and have given the go-ahead, going live on [Vercel](https://vercel.com) looks like this:

0. **Set up the leads Sheet first** ([section 3](#3-quote-requests-the-leads-sheet)) so you have the `/exec` address for `NEXT_PUBLIC_LEADS_ENDPOINT`.
1. **Connect the code to Vercel.** Sign in to Vercel, choose **Add New** > **Project** and import this project's Git repository. Vercel recognises it as a Next.js site; the default build settings are correct.
2. **Add the settings.** In the project's **Settings** > **Environment Variables**, add every setting from [section 2](#2-settings-environment-variables) with its real value. Leave `ALLOW_INDEXING` empty for now.
3. **Add the domain www.goodbizchemicals.com.**
   1. In **Settings** > **Domains**, add `www.goodbizchemicals.com`, and follow Vercel's instructions to point it there at your domain registrar.
   2. Also add `goodbizchemicals.com` (without `www`) and choose to **redirect** it to `www.goodbizchemicals.com`.
   3. In **Settings** > **Environment Variables**, set `SITE_URL=https://www.goodbizchemicals.com`.
   4. **Redeploy** (Deployments > Redeploy), so links, the sitemap and `llms.txt` use the new address.
4. **Check the live site** with a real quote request: the row appears in the Leads tab and the alert email reaches chemicals@goodbizglobal.com. Then run `npm audit --omit=dev` on your computer and deal with anything it reports.
5. **Open the site to Google.** Once the real contact details are in and you are happy with the content, set `ALLOW_INDEXING=true` and redeploy (see [section 4](#4-the-allow_indexing-switch)).
6. **Submit the sitemap** in Google Search Console ([section 9](#9-google-search-console)) and enable Web Analytics ([section 8](#8-vercel-web-analytics)).

---

## Where things live

| What | Where |
| --- | --- |
| Product names, HSN and CAS numbers, descriptions, FAQs | `src/content/products.ts` |
| Company name, tagline and contact details | `src/config/site.ts` |
| Blog posts | `content/blog/` |
| Colours and fonts | `src/app/globals.css`, explained in `docs/design/direction.md` |
| The quote form | `src/components/StepQuoteForm.tsx` (screens), `src/lib/leads/` (wording, options and sending) |
| Where quote requests are saved | `apps-script/leads/Code.gs`, set up as in `docs/leads-apps-script.md` |
| Automated checks | `tests/` |
