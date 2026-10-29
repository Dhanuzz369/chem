import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { INDEXNOW_KEY, SITE_URL, indexNowPayload, sitemapUrls } from "../../scripts/indexnow.mjs";

describe("IndexNow key", () => {
  it("is served from public/ as a file that holds only the key", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    const file = path.join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
    expect(fs.readFileSync(file, "utf8")).toBe(INDEXNOW_KEY);
  });
});

describe("sitemapUrls", () => {
  it("lists this site's URLs once each and drops other hosts", () => {
    const xml = `<urlset>
      <url><loc>https://www.goodbizchemicals.com</loc></url>
      <url><loc> https://www.goodbizchemicals.com/products?a=1&amp;b=2 </loc></url>
      <url><loc>https://www.goodbizchemicals.com</loc></url>
      <url><loc>https://elsewhere.example/page</loc></url>
      <url><loc>not a url</loc></url>
    </urlset>`;
    expect(sitemapUrls(xml)).toEqual([
      "https://www.goodbizchemicals.com",
      "https://www.goodbizchemicals.com/products?a=1&b=2",
    ]);
  });
});

describe("indexNowPayload", () => {
  it("names the host and where the key file lives", () => {
    expect(indexNowPayload([`${SITE_URL}/about`])).toEqual({
      host: "www.goodbizchemicals.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://www.goodbizchemicals.com/${INDEXNOW_KEY}.txt`,
      urlList: ["https://www.goodbizchemicals.com/about"],
    });
  });

  it("refuses an empty list or more than 10,000 URLs", () => {
    expect(() => indexNowPayload([])).toThrow(/No URLs/);
    expect(() => indexNowPayload(Array.from({ length: 10_001 }, (_, i) => `${SITE_URL}/${i}`))).toThrow(/10,000/);
  });
});
