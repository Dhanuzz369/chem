import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/quote/route";
import { createSheetsStore } from "@/lib/quote/sheets-store";
import { setQuoteStoreForTests } from "@/lib/quote/store";
import type { QuoteRecord } from "@/lib/quote/store";

let saved: QuoteRecord[] = [];
let ipCounter = 0;

function valid(over: Record<string, unknown> = {}) {
  return {
    name: "Asha Rao",
    email: "asha@example.com",
    country: "India",
    products: ["methanol"],
    quantity: 10,
    quantityUnit: "MT",
    website: "",
    startedAt: Date.now() - 10_000,
    ...over,
  };
}

function req(body: unknown, ip?: string) {
  return new Request("http://localhost/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip ?? `10.0.0.${++ipCounter}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  saved = [];
  setQuoteStoreForTests({ save: async (r) => void saved.push(r) });
});

describe("POST /api/quote", () => {
  it("saves valid request", async () => {
    const res = await POST(req(valid()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(saved).toHaveLength(1);
    expect(saved[0].products).toEqual(["methanol"]);
  });

  it("rejects missing required fields", async () => {
    const res = await POST(req({ website: "", startedAt: Date.now() - 10_000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid");
    for (const k of ["name", "email", "country", "products", "quantity"]) {
      expect(Object.keys(body.fields)).toContain(k);
    }
  });

  it("rejects unknown product slug", async () => {
    const res = await POST(req(valid({ products: ["not-a-chemical"] })));
    expect(res.status).toBe(400);
  });

  it("honeypot is silently dropped", async () => {
    const res = await POST(req(valid({ website: "http://spam.example" })));
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(0);
  });

  it("too-fast submit is silently dropped", async () => {
    const res = await POST(req(valid({ startedAt: Date.now() - 500 })));
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(0);
  });

  it("accepts large and decimal quantities", async () => {
    expect((await POST(req(valid({ quantity: 500 })))).status).toBe(200);
    expect((await POST(req(valid({ quantity: 1.5 })))).status).toBe(200);
    expect(saved.map((r) => r.quantity)).toEqual([500, 1.5]);
  });

  it("rejects zero and negative quantity", async () => {
    for (const quantity of [0, -5]) {
      const res = await POST(req(valid({ quantity })));
      expect(res.status).toBe(400);
      expect(Object.keys((await res.json()).fields)).toContain("quantity");
    }
  });

  it("drops a request with no startedAt without saving", async () => {
    const { startedAt: _omit, ...body } = valid();
    void _omit;
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect(saved).toHaveLength(0);
  });

  it("rate limits sixth request from same ip", async () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) expect((await POST(req(valid(), ip))).status).toBe(200);
    const res = await POST(req(valid(), ip));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ ok: false, error: "rate_limited" });
  });

  it("returns 500 save_failed when store throws", async () => {
    setQuoteStoreForTests({
      save: async () => {
        throw new Error("boom");
      },
    });
    const res = await POST(req(valid()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "save_failed" });
  });
});

describe("sheets store", () => {
  it("throws on missing env", async () => {
    const record = { ...valid(), submittedAt: "now", source: "web" } as unknown as QuoteRecord;
    await expect(createSheetsStore({}).save(record)).rejects.toThrow(/GOOGLE_SHEET_ID/);
  });
});
