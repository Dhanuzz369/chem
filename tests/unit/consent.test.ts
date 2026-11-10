import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_REGIONS, asksFirst } from "@/lib/consent-regions";
import { ASK_FIRST_ZONES } from "@/lib/consent-zones.generated";
import {
  choiceInEffect,
  consentDefaults,
  denyAnalytics,
  gaCookieDeletions,
  grantAnalytics,
  loadGtag,
  parseChoice,
} from "@/lib/consent";

const ADS_DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

describe("ask-first regions", () => {
  it("has the group's 129 countries, India and the USA not among them", () => {
    expect(CONSENT_REGIONS).toHaveLength(129);
    expect(new Set(CONSENT_REGIONS).size).toBe(129);
    expect(CONSENT_REGIONS).not.toContain("IN");
    expect(CONSENT_REGIONS).not.toContain("US");
  });

  it("lists about 200 generated zones and leaves Europe/* to the prefix rule", () => {
    expect(ASK_FIRST_ZONES.length).toBeGreaterThan(180);
    expect(ASK_FIRST_ZONES.some((z) => z.startsWith("Europe/"))).toBe(false);
  });

  it.each(["Europe/Berlin", "Asia/Riyadh", "America/Sao_Paulo", "Africa/Nairobi", "Asia/Saigon", "Asia/Ho_Chi_Minh"])(
    "asks first in %s",
    (zone) => expect(asksFirst(zone)).toBe(true),
  );

  it.each(["Asia/Calcutta", "Asia/Kolkata", "America/New_York"])("counts by default in %s", (zone) => {
    expect(asksFirst(zone)).toBe(false);
  });

  it("asks first when the browser gives no zone", () => {
    expect(asksFirst(undefined)).toBe(true);
    expect(asksFirst("")).toBe(true);
  });
});

describe("choice in effect", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const stored = (analytics: string, at: string) => JSON.stringify({ v: 1, analytics, at });

  it("a stored choice wins over the time zone", () => {
    expect(choiceInEffect("granted", true)).toBe("granted");
    expect(choiceInEffect("denied", false)).toBe("denied");
  });

  it("without a choice: the banner in ask-first zones, analytics on elsewhere", () => {
    expect(choiceInEffect(null, true)).toBe("ask");
    expect(choiceInEffect(null, false)).toBe("default");
  });

  it("reads a choice for 12 months, then asks again", () => {
    expect(parseChoice(stored("granted", "2026-01-01T00:00:00Z"), now)).toBe("granted");
    expect(parseChoice(stored("denied", "2025-11-11T00:00:00Z"), now)).toBe("denied");
    expect(parseChoice(stored("granted", "2025-11-09T00:00:00Z"), now)).toBeNull();
  });

  it("ignores missing, malformed or unknown stored values", () => {
    for (const raw of [null, "", "granted", "{}", stored("maybe", now.toISOString()), JSON.stringify({ v: 2, analytics: "granted", at: now.toISOString() }), stored("granted", "not a date")]) {
      expect(parseChoice(raw, now)).toBeNull();
    }
  });
});

describe("consent defaults", () => {
  it("a default visitor: denied for the ask-first countries by IP, then granted elsewhere", () => {
    expect(consentDefaults("default")).toEqual([
      { ...ADS_DENIED, analytics_storage: "denied", region: CONSENT_REGIONS },
      { ...ADS_DENIED, analytics_storage: "granted" },
    ]);
  });

  it("after Accept: granted, advertising still denied", () => {
    expect(consentDefaults("granted")).toEqual([{ ...ADS_DENIED, analytics_storage: "granted" }]);
  });
});

/** A window with just what the loader touches. */
function fakeWindow(hostname = "www.goodbizchemicals.com", cookie = "") {
  const appended: { src: string; async: boolean }[] = [];
  const written: string[] = [];
  const doc = {
    createElement: () => ({ src: "", async: false }),
    head: { appendChild: (el: { src: string; async: boolean }) => appended.push(el) },
    get cookie() {
      return cookie;
    },
    set cookie(value: string) {
      written.push(value);
    },
  };
  const w = { document: doc, location: { hostname } } as unknown as Window & Record<string, unknown> & { dataLayer: IArguments[] };
  return { w, appended, written };
}

const calls = (w: { dataLayer: IArguments[] }) => w.dataLayer.map((args) => Array.from(args));

describe("loading the tag", () => {
  it("sets both consent defaults before gtag('js'), then config without ad signals, then gtag.js async", () => {
    const { w, appended } = fakeWindow();
    loadGtag("default", w);
    const sent = calls(w);
    expect(sent.slice(0, 2)).toEqual(consentDefaults("default").map((d) => ["consent", "default", d]));
    expect(sent[2][0]).toBe("js");
    expect(sent[3]).toEqual(["config", "G-4WJVCQDVY1", { allow_google_signals: false, allow_ad_personalization_signals: false }]);
    expect(appended).toEqual([{ src: "https://www.googletagmanager.com/gtag/js?id=G-4WJVCQDVY1", async: true }]);
  });

  it("loads once per page", () => {
    const { w, appended } = fakeWindow();
    loadGtag("granted", w);
    loadGtag("granted", w);
    expect(appended).toHaveLength(1);
  });

  it("Accept updates consent when the tag is there, and loads it only on the live host", () => {
    const live = fakeWindow();
    loadGtag("default", live.w);
    grantAnalytics(live.w);
    expect(calls(live.w).at(-1)).toEqual(["consent", "update", { analytics_storage: "granted" }]);

    const fresh = fakeWindow();
    grantAnalytics(fresh.w);
    expect(fresh.appended).toHaveLength(1);
    expect(calls(fresh.w)[0]).toEqual(["consent", "default", { ...ADS_DENIED, analytics_storage: "granted" }]);

    const preview = fakeWindow("chem-phi.vercel.app");
    grantAnalytics(preview.w);
    expect(preview.appended).toHaveLength(0);
  });

  it("Reject disables the tag, updates consent and deletes every _ga cookie", () => {
    const { w, written } = fakeWindow("www.goodbizchemicals.com", "_ga=1; theme=x; _ga_4WJVCQDVY1=2");
    loadGtag("default", w);
    denyAnalytics(w);
    expect(w["ga-disable-G-4WJVCQDVY1"]).toBe(true);
    expect(calls(w).at(-1)).toEqual(["consent", "update", { analytics_storage: "denied" }]);
    expect(written).toEqual(gaCookieDeletions("_ga=1; theme=x; _ga_4WJVCQDVY1=2", "www.goodbizchemicals.com"));
  });
});

describe("gaCookieDeletions", () => {
  it("expires _ga and _ga_* on the host and every parent domain, and nothing else", () => {
    const out = gaCookieDeletions("_ga=1; theme=x; _ga_4WJVCQDVY1=2; _gat=3", "www.goodbizchemicals.com");
    const domains = [
      "",
      "; domain=.www.goodbizchemicals.com",
      "; domain=www.goodbizchemicals.com",
      "; domain=.goodbizchemicals.com",
      "; domain=goodbizchemicals.com",
    ];
    expect(out).toEqual(["_ga", "_ga_4WJVCQDVY1"].flatMap((n) => domains.map((d) => `${n}=; Max-Age=0; path=/${d}`)));
    expect(out.some((c) => c.includes("domain=.com") || c.includes("domain=com"))).toBe(false);
  });

  it("does nothing when there are no Analytics cookies", () => {
    expect(gaCookieDeletions("", "www.goodbizchemicals.com")).toEqual([]);
  });
});

afterEach(() => vi.unstubAllGlobals());
