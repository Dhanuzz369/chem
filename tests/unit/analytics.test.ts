import { afterEach, describe, expect, it, vi } from "vitest";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled, trackEvent } from "@/lib/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("analytics", () => {
  it("uses the site's GA4 stream", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-4WJVCQDVY1");
  });

  it("is on for the production deploy only", () => {
    expect(isAnalyticsEnabled({ VERCEL_ENV: "production" })).toBe(true);
    for (const VERCEL_ENV of [undefined, "preview", "development"]) expect(isAnalyticsEnabled({ VERCEL_ENV })).toBe(false);
  });

  it("sends events through gtag when it is loaded", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    trackEvent("generate_lead", { form: "quote" });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", { form: "quote" });
  });

  it("does nothing on the server or when the tag is missing or blocked", () => {
    expect(() => trackEvent("generate_lead")).not.toThrow();
    vi.stubGlobal("window", {});
    expect(() => trackEvent("generate_lead")).not.toThrow();
  });
});
