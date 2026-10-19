import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { QuoteRecord } from "@/lib/quote/store";

const jwt = vi.hoisted(() => ({
  options: [] as { key?: string }[],
  getAccessToken: vi.fn(async (): Promise<{ token?: string | null }> => ({ token: "tok" })),
}));

vi.mock("google-auth-library", () => ({
  JWT: class {
    constructor(options: { key?: string }) {
      jwt.options.push(options);
    }
    getAccessToken() {
      return jwt.getAccessToken();
    }
  },
}));

const { createSheetsStore, safeCell, SheetsStoreError } = await import("@/lib/quote/sheets-store");

const KEY = "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n";
const env = {
  GOOGLE_SHEET_ID: "sheet",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "bot@x.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: KEY,
};

const record: QuoteRecord = {
  submittedAt: "2026-10-19T10:00:00.000Z",
  name: "Asha Rao",
  company: "Acme",
  email: "asha@example.com",
  phone: "+91 98765 43210",
  country: "India",
  products: ["methanol", "toluene"],
  quantity: 10,
  quantityUnit: "MT",
  packaging: "Drums",
  port: "Nhava Sheva",
  message: "Hello",
  source: "website",
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  jwt.options.length = 0;
  jwt.getAccessToken.mockReset().mockResolvedValue({ token: "tok" });
  fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("sheets store", () => {
  it("throws on missing env", async () => {
    await expect(createSheetsStore({}).save(record)).rejects.toThrow(/GOOGLE_SHEET_ID/);
  });

  it("accepts a private key pasted with surrounding quotes", async () => {
    await createSheetsStore({ ...env, GOOGLE_PRIVATE_KEY: ` "${KEY}" ` }).save(record);
    const key = jwt.options[0].key!;
    expect(key.startsWith("-----BEGIN PRIVATE KEY-----\nABC\n")).toBe(true);
    expect(key).not.toMatch(/"|\\n/);
    expect(jwt.getAccessToken).toHaveBeenCalledOnce();
  });

  it("turns an auth failure into a SheetsStoreError", async () => {
    jwt.getAccessToken.mockRejectedValue(new Error("invalid_grant"));
    const err = await createSheetsStore(env).save(record).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SheetsStoreError);
    expect((err as Error).message).toBe("Google auth failed: invalid_grant");
  });

  it("sends a timeout signal and reports a timeout as a SheetsStoreError", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
    const err = await createSheetsStore(env).save(record).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SheetsStoreError);
    expect((err as Error).message).toBe("Sheets request timed out");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("writes one row in the README's A to M column order", async () => {
    await createSheetsStore(env).save(record);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/spreadsheets/sheet/values/Quotes!A%3AM:append");
    // Submitted at, Name, Company, Email, Phone, Country, Products, Quantity, Unit, Packaging, Port, Message, Source
    expect(JSON.parse(String(init.body))).toEqual({
      values: [
        [
          "2026-10-19T10:00:00.000Z",
          "Asha Rao",
          "Acme",
          "asha@example.com",
          "+91 98765 43210",
          "India",
          "Methanol, Toluene",
          10,
          "MT",
          "Drums",
          "Nhava Sheva",
          "Hello",
          "website",
        ],
      ],
    });
  });

  it("reports a failed append with its status only", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(createSheetsStore(env).save(record)).rejects.toThrow("Sheets append failed: 403");
  });
});

describe("safeCell", () => {
  it("neutralises formula starters and leaves normal text", () => {
    expect(safeCell("=HYPERLINK(\"http://x\")")).toBe("'=HYPERLINK(\"http://x\")");
    expect(safeCell("+1+cmd|' /C calc'!A0")).toBe("'+1+cmd|' /C calc'!A0");
    expect(safeCell("-1")).toBe("'-1");
    expect(safeCell("-2+3")).toBe("'-2+3");
    expect(safeCell("@a")).toBe("'@a");
    expect(safeCell("\tx")).toBe("'\tx");
    expect(safeCell("\rx")).toBe("'\rx");
    expect(safeCell("Acme")).toBe("Acme");
  });

  it("leaves plain phone numbers alone", () => {
    expect(safeCell("+91 98765 43210")).toBe("+91 98765 43210");
    expect(safeCell("+1 (555) 010-0000")).toBe("+1 (555) 010-0000");
    expect(safeCell("+44.20.7946.0000")).toBe("+44.20.7946.0000");
  });
});
