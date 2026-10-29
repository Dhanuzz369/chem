// Tells Bing, Yandex, Naver, Seznam and Yep (through IndexNow) that the site's pages changed.
// Run after a production deploy: node scripts/indexnow.mjs
// The key is public by design: search engines check it against public/<key>.txt on the live site.
import { pathToFileURL } from "node:url";

export const INDEXNOW_KEY = "c86cadfab24a9118baa4bac9ae5269f4";
export const SITE_URL = "https://www.goodbizchemicals.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** The <loc> URLs in a sitemap that belong to the site, without duplicates. */
export function sitemapUrls(xml, siteUrl = SITE_URL) {
  const host = new URL(siteUrl).host;
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  return [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
}

/** The JSON body IndexNow expects. It accepts up to 10,000 URLs per request. */
export function indexNowPayload(urls, siteUrl = SITE_URL, key = INDEXNOW_KEY) {
  if (urls.length === 0) throw new Error("No URLs to submit");
  if (urls.length > 10_000) throw new Error(`IndexNow takes at most 10,000 URLs, got ${urls.length}`);
  return { host: new URL(siteUrl).host, key, keyLocation: `${siteUrl}/${key}.txt`, urlList: urls };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for the deploy to serve the key file, since IndexNow rejects a key it cannot fetch. */
async function waitForKey(siteUrl, key, tries = 6) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetch(`${siteUrl}/${key}.txt`, { cache: "no-store" }).catch(() => null);
    if (res?.ok && (await res.text()).trim() === key) return;
    if (i < tries) await sleep(10_000);
  }
  throw new Error(`${siteUrl}/${key}.txt is not live with the key yet`);
}

async function main() {
  await waitForKey(SITE_URL, INDEXNOW_KEY);
  const sitemap = await fetch(`${SITE_URL}/sitemap.xml`, { cache: "no-store" });
  if (!sitemap.ok) throw new Error(`sitemap.xml answered ${sitemap.status}`);
  const payload = indexNowPayload(sitemapUrls(await sitemap.text()));
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  // 200 means accepted, 202 means accepted while the key is still being checked.
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`IndexNow answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  console.log(`IndexNow accepted ${payload.urlList.length} URLs (HTTP ${res.status}).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
