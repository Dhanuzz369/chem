# Goodbiz Chem website

The Goodbiz Chem website: a product catalogue of 19 industrial chemicals listed by HSN code, a quote request form that saves every request to a Google Sheet, a blog, and About and Contact pages.

This guide is written for the business owner. You do not need to be a developer to follow it, but a few steps use the Terminal app on a Mac.

> **Nothing is live yet.** The site has not been deployed. Putting it on the internet waits for your go-ahead; see [Going live](#going-live-waits-for-your-go-ahead) at the end.

---

## 1. Run the site on your own computer

You need [Node.js](https://nodejs.org) version 20 or newer (the "LTS" download is fine).

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
| `npm run e2e` | Opens the site in a test browser (phone and desktop sizes) and checks every page. Before the first run, install the test browser once with `npx playwright install chromium`. |
| `npm run build` | Builds the finished site, exactly as it will run when live. |
| `npm run lint` | Checks the code for common mistakes. |

---

## 2. Settings (environment variables)

Settings live in a file called `.env.local` in the project folder on your computer, and in the Vercel dashboard once the site is live. This file holds private keys, so it is never shared or committed. `.env.example` lists every setting with an empty value.

| Setting | What to put in it | Example |
| --- | --- | --- |
| `SITE_URL` | The full web address of the site, without a slash at the end. Used for links in search results, the sitemap and social previews. Leave empty on your computer. | `https://www.example.com` |
| `ALLOW_INDEXING` | `true` lets Google list the site. Anything else (including empty) keeps it hidden. See [section 4](#4-the-allow_indexing-switch). | `true` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The email address of the Google service account that writes quote requests to your sheet. | `quotes@goodbiz-site.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | The private key from that service account's JSON key file (the `private_key` value), in double quotes. Keep the `\n` sequences as they are. | `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"` |
| `GOOGLE_SHEET_ID` | The long ID in your Google Sheet's web address, between `/d/` and `/edit`. | `1AbC...xYz` |
| `GOOGLE_SHEET_RANGE` | Optional. Where new rows go. Leave empty to use the tab called `Quotes`, columns A to M. | `Quotes!A:M` |

If the Google settings are missing, the quote form still shows, but sending fails with a polite "please try again" message, so set them up before going live.

---

## 3. Quote requests: the Google service account and Sheet

Every quote request becomes one new row in a Google Sheet you own. A "service account" is a robot Google user that the website signs in as to add those rows.

### Create the service account (one time)

1. Go to the [Google Cloud console](https://console.cloud.google.com) and sign in with the Google account that should own this.
2. Create a project (top bar, **Select a project** > **New project**), for example "Goodbiz website".
3. In the search bar, open **Google Sheets API** and click **Enable**.
4. Open **IAM & Admin** > **Service Accounts** > **Create service account**. Give it a name such as "quotes" and click **Done** (it needs no roles).
5. Click the new service account, open the **Keys** tab, then **Add key** > **Create new key** > **JSON**. A file downloads. Keep it safe: anyone with this file can write to sheets shared with the account.
6. From that file, copy `client_email` into `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` into `GOOGLE_PRIVATE_KEY`.

### Create the Sheet (one time)

1. Create a new Google Sheet, for example "Goodbiz quote requests".
2. Rename the first tab to **Quotes** (exactly, with a capital Q).
3. Type this header row into row 1, one word per column from A to M:

   | A | B | C | D | E | F | G | H | I | J | K | L | M |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | Submitted at | Name | Company | Email | Phone | Country | Products | Quantity | Unit | Packaging | Port | Message | Source |

   Or paste this line into cell A1 and use **Data** > **Split text to columns** (comma):
   ```
   Submitted at,Name,Company,Email,Phone,Country,Products,Quantity,Unit,Packaging,Port,Message,Source
   ```
4. Click **Share**, paste the service account's email address, give it **Editor** access and untick "Notify people".
5. Copy the Sheet ID from the address bar into `GOOGLE_SHEET_ID`.

"Submitted at" is in UTC (international time). "Products" lists the product names separated by commas. "Source" is always `website`. Do not reorder the columns; the website writes them in this order.

To test it, run the site, send a quote request from <http://localhost:3000/quote> and check that a row appears.

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

The site never shows made-up contact details, so the email, phone, WhatsApp and address are empty until you add them. Anything left empty is simply not shown.

Open `src/config/site.ts` and fill in the `contact` block:

```ts
contact: {
  email: "sales@example.com",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  address: "Unit 4, Example Industrial Estate, City, State, PIN, India",
},
```

Delete any line you do not want to show. Phone and WhatsApp numbers should include the country code. These details then appear on the Contact page, in the footer, in the quote form's error message and in the search-engine data for the company.

---

## 6. Adding a blog post

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
   - `products` lists product page names exactly as they appear in the address, for example `methanol` for `/products/methanol`.
3. Below the second `---`, write the post in [Markdown](https://www.markdownguide.org/basic-syntax/): `## ` starts a section heading, `- ` starts a bullet, `[text](/products/toluene)` makes a link.
4. Start with a short paragraph that answers the title's question, and phrase section headings as questions. The checks (`npm test`) expect 700 to 1,200 words.
5. Do not claim certifications, years in business, volumes, purity guarantees or regulatory compliance unless they are true and you can prove them. The checks reject the most common ones.
6. Run `npm test`, then look at the post at <http://localhost:3000/blog>. It appears on the blog page, on the home page if it is among the newest three, and in the sitemap.

---

## 7. Vercel Web Analytics

The site includes Vercel Web Analytics, which counts visits and page views without cookies or cookie banners. It only runs on Vercel; on your computer it is switched off. It relies on Vercel's default **Automatically expose System Environment Variables** setting (under **Settings** > **Environment Variables**), so leave that switched on. After the site is live, open the project in the Vercel dashboard, go to the **Analytics** tab and click **Enable**. Numbers start appearing after the next deployment.

---

## 8. Google Search Console

Search Console shows how the site appears in Google and lets you ask Google to read it.

1. When the site is live on its real domain and `ALLOW_INDEXING=true` is deployed, go to [Google Search Console](https://search.google.com/search-console) and click **Add property**.
2. Choose **Domain**, type your domain (for example `example.com`) and follow the instructions to add a TXT record at your domain registrar. This proves you own the domain and needs no change to the website.
3. Once verified, open **Sitemaps**, enter `sitemap.xml` and click **Submit**. The sitemap lists every product page, blog post and main page.
4. Use **URL inspection** on the home page and a product page and click **Request indexing** to speed things up.

---

## Going live (waits for your go-ahead)

The site has **not** been deployed, and nothing in this project deploys it automatically. When you are ready and have given the go-ahead, going live on [Vercel](https://vercel.com) looks like this:

1. **Connect the code to Vercel.** Sign in to Vercel, choose **Add New** > **Project** and import this project's Git repository. Vercel recognises it as a Next.js site; the default build settings are correct.
2. **Add the settings.** In the project's **Settings** > **Environment Variables**, add every setting from [section 2](#2-settings-environment-variables) with its real value. Leave `ALLOW_INDEXING` empty for now.
3. **Add the domain.** In **Settings** > **Domains**, add your domain and follow Vercel's instructions to point it there at your registrar. Set `SITE_URL` to that domain.
4. **Check the live site** with a real quote request and confirm the row lands in the Sheet.
5. **Open the site to Google.** Once the real contact details are in and you are happy with the content, set `ALLOW_INDEXING=true` and redeploy (see [section 4](#4-the-allow_indexing-switch)).
6. **Submit the sitemap** in Google Search Console ([section 8](#8-google-search-console)) and enable Web Analytics ([section 7](#7-vercel-web-analytics)).

---

## Where things live

| What | Where |
| --- | --- |
| Product names, HSN and CAS numbers, descriptions, FAQs | `src/content/products.ts` |
| Company name, tagline and contact details | `src/config/site.ts` |
| Blog posts | `content/blog/` |
| Colours and fonts | `src/app/globals.css`, explained in `docs/design/direction.md` |
| Where quote requests are saved | `src/lib/quote/` |
| Automated checks | `tests/` |
