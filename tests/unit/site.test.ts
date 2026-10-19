import { describe, expect, it } from "vitest";
import { getSiteUrl, isIndexingAllowed, site } from "@/config/site";

describe("site config", () => {
  it("resolves the site url without a trailing slash", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3000");
    expect(getSiteUrl({ SITE_URL: "https://x.com/" })).toBe("https://x.com");
  });

  it("only allows indexing when ALLOW_INDEXING is exactly 'true'", () => {
    expect(isIndexingAllowed({})).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "1" })).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "true" })).toBe(true);
  });

  it("has the company name, and any contact detail that is set is real text", () => {
    expect(site.name).toBe("Goodbiz Chem");
    // Contact details start empty and are filled in by the owner (see README); either state is valid.
    for (const [field, value] of Object.entries(site.contact)) {
      if (value === undefined) continue;
      expect(typeof value, field).toBe("string");
      expect(value.trim(), field).not.toBe("");
    }
  });
});
