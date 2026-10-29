import { describe, expect, it } from "vitest";
import { assertSiteUrlForIndexing, missingContactWarning } from "@/config/build-checks";
import nextConfig from "../../next.config";

describe("assertSiteUrlForIndexing", () => {
  it("fails when indexing is on and SITE_URL is empty", () => {
    expect(() => assertSiteUrlForIndexing({ ALLOW_INDEXING: "true" })).toThrow(/SITE_URL/);
    expect(() => assertSiteUrlForIndexing({ ALLOW_INDEXING: "true", SITE_URL: "  " })).toThrow(/SITE_URL/);
  });

  it("passes when SITE_URL is set or indexing is off", () => {
    expect(() => assertSiteUrlForIndexing({ ALLOW_INDEXING: "true", SITE_URL: "https://x.com" })).not.toThrow();
    expect(() => assertSiteUrlForIndexing({})).not.toThrow();
    expect(() => assertSiteUrlForIndexing({ ALLOW_INDEXING: "false" })).not.toThrow();
    expect(() => assertSiteUrlForIndexing({ VERCEL_ENV: "production" })).not.toThrow();
  });
});

describe("missingContactWarning", () => {
  it("warns on a production build with no contact details", () => {
    expect(missingContactWarning({ VERCEL_ENV: "production" }, {})).toMatch(/contact/i);
    expect(missingContactWarning({ VERCEL_ENV: "production" }, { email: " " })).toMatch(/contact/i);
  });

  it("stays quiet outside production or once any detail is set", () => {
    expect(missingContactWarning({}, {})).toBeUndefined();
    expect(missingContactWarning({ VERCEL_ENV: "preview" }, {})).toBeUndefined();
    expect(missingContactWarning({ VERCEL_ENV: "production" }, { email: "sales@example.com" })).toBeUndefined();
  });
});

describe("next.config", () => {
  it("hides the X-Powered-By header and sends security headers on every route", async () => {
    const config = nextConfig("phase-development-server");
    expect(config.poweredByHeader).toBe(false);
    const rules = await config.headers!();
    const all = rules.find((r) => r.source === "/:path*");
    expect(all).toBeDefined();
    expect(Object.fromEntries(all!.headers.map((h) => [h.key, h.value]))).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": expect.stringContaining("frame-ancestors 'none'"),
    });
  });
});

describe("redirects", () => {
  it("sends the old Vercel address to www.goodbizchemicals.com, keeping the path", async () => {
    const rules = await nextConfig("phase-development-server").redirects!();
    expect(rules).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "chem-phi.vercel.app" }],
      destination: "https://www.goodbizchemicals.com/:path*",
      permanent: true,
    });
  });
});
