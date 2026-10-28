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

  it("has the company name and the owner's contact details (supplied 2026-10-28)", () => {
    expect(site.name).toBe("Goodbiz Chem");
    expect(site.contact).toEqual({
      email: "chemicals@goodbizglobal.com",
      phone: "+91 8884799369",
      whatsapp: "+91 8884799369",
      address: "Bengaluru, Karnataka, India",
    });
  });
});
