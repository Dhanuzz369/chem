import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { CLEAR as CLIENT_CLEAR, PAYLOAD_KEYS } from "@/lib/leads/payload";

type Row = Record<string, string>;
type Script = {
  HEADERS: string[];
  STAGES: string[];
  CLEAR: string;
  safeCell(v: unknown): string;
  mergeRow(existing: Row, data: Record<string, unknown>, nowIso: string, leadId: string): Row;
  furthestStage(a: string, b: string): string;
  alertKind(prev: string, next: string, isNew: boolean): string | null;
  toObject(values: unknown[]): Row;
  formFields(parameters: Record<string, string[]>): Record<string, string>;
  LIMITS: { newLeadsPerHour: number; updatesPerLeadPerHour: number; alertEmailsPerHour: number; maxBodyBytes: number };
  hourBucket(date: Date): string;
  overLimit(count: number, max: number): boolean;
  rateKeys(bucket: string, leadId: string): { newLead: string; update: string; alert: string };
  bodyTooLarge(contents: string, maxBytes: number): boolean;
  validLeadId(id: string): boolean;
  alertSubject(kind: string, row: Row): string;
};

function loadScript(): Script {
  const code = readFileSync(join(process.cwd(), "apps-script/leads/Code.gs"), "utf8");
  const sandbox = { module: { exports: {} as Script }, console };
  runInNewContext(code, sandbox, { filename: "Code.gs" });
  return sandbox.module.exports;
}

const gs = loadScript();
const blank = (): Row => gs.toObject([]);

describe("Apps Script helpers", () => {
  it("the website payload matches the sheet headers and clear marker", () => {
    const server = ["firstSeen", "updated"];
    expect([...PAYLOAD_KEYS].sort()).toEqual(gs.HEADERS.filter((h) => !server.includes(h)).sort());
    expect(CLIENT_CLEAR).toBe(gs.CLEAR);
  });

  it("formFields joins repeated no-JavaScript form fields (packaging) with a comma", () => {
    expect(gs.formFields({ name: ["Asha"], packaging: ["Drums", "IBC tanks"], leadId: [""] })).toEqual({
      name: "Asha",
      packaging: "Drums, IBC tanks",
      leadId: "",
    });
  });

  it("abuse caps default to 60 new leads, 40 updates per lead and 30 alert emails an hour, and 20 KB bodies", () => {
    expect(gs.LIMITS).toEqual({ newLeadsPerHour: 60, updatesPerLeadPerHour: 40, alertEmailsPerHour: 30, maxBodyBytes: 20 * 1024 });
  });

  it("hourBucket is the UTC hour as yyyyMMddHH", () => {
    expect(gs.hourBucket(new Date(Date.UTC(2026, 9, 28, 7, 59, 59)))).toBe("2026102807");
    expect(gs.hourBucket(new Date(Date.UTC(2026, 0, 2, 23, 0, 0)))).toBe("2026010223");
  });

  it("overLimit allows up to max per hour and refuses the next one", () => {
    expect(gs.overLimit(0, 60)).toBe(false);
    expect(gs.overLimit(59, 60)).toBe(false);
    expect(gs.overLimit(60, 60)).toBe(true);
    expect(gs.overLimit(61, 60)).toBe(true);
    // A cap of 0 refuses everything; a missing or garbled count counts as 0.
    expect(gs.overLimit(0, 0)).toBe(true);
    expect(gs.overLimit(Number("x"), 5)).toBe(false);
  });

  it("rateKeys buckets new leads and alerts per hour, and updates per lead per hour", () => {
    expect(gs.rateKeys("2026102807", "lead-1234")).toEqual({
      newLead: "new:2026102807",
      update: "upd:lead-1234:2026102807",
      alert: "mail:2026102807",
    });
  });

  it("bodyTooLarge counts UTF-8 bytes", () => {
    expect(gs.bodyTooLarge("a".repeat(20 * 1024), 20 * 1024)).toBe(false);
    expect(gs.bodyTooLarge("a".repeat(20 * 1024 + 1), 20 * 1024)).toBe(true);
    // "é" is 2 bytes and "€" is 3 bytes in UTF-8.
    expect(gs.bodyTooLarge("é".repeat(10), 19)).toBe(true);
    expect(gs.bodyTooLarge("€".repeat(10), 30)).toBe(false);
    expect(gs.bodyTooLarge("", 0)).toBe(false);
  });

  it("safeCell escapes formula starters only", () => {
    expect(gs.safeCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(gs.safeCell("+91 98765")).toBe("'+91 98765");
    expect(gs.safeCell("-5")).toBe("'-5");
    expect(gs.safeCell("@me")).toBe("'@me");
    expect(gs.safeCell("\tx")).toBe("'\tx");
    expect(gs.safeCell("\rx")).toBe("'\rx");
    expect(gs.safeCell("Asha")).toBe("Asha");
    expect(gs.safeCell("a=b")).toBe("a=b");
  });

  it("mergeRow keeps, clears and never blanks", () => {
    const first = gs.mergeRow(blank(), { stage: "contact", name: "Asha", email: "a@b.co", phone: "+91 1234567" },
      "2026-10-28T10:00:00.000Z", "lead-1234");
    expect(first.leadId).toBe("lead-1234");
    expect(first.firstSeen).toBe("2026-10-28T10:00:00.000Z");
    expect(first.stage).toBe("contact");
    expect(first.phone).toBe("'+91 1234567");

    const second = gs.mergeRow(first, {
      stage: "product", name: "", email: "", group: "Solvents", product: "Methanol", company: "  ",
    }, "2026-10-28T10:01:00.000Z", "lead-1234");
    expect(second.name).toBe("Asha");
    expect(second.email).toBe("a@b.co");
    expect(second.company).toBe("");
    expect(second.group).toBe("Solvents");
    expect(second.firstSeen).toBe("2026-10-28T10:00:00.000Z");
    expect(second.updated).toBe("2026-10-28T10:01:00.000Z");

    const third = gs.mergeRow(second, {
      stage: "product", group: "__clear__", product: "__clear__", otherProduct: "Glycerine",
      packaging: ["Drums", "Bags"], firstSeen: "hack",
    }, "2026-10-28T10:02:00.000Z", "lead-1234");
    expect(third.group).toBe("");
    expect(third.product).toBe("");
    expect(third.otherProduct).toBe("Glycerine");
    expect(third.packaging).toBe("Drums, Bags");
    expect(third.firstSeen).toBe("2026-10-28T10:00:00.000Z");
    expect(third.name).toBe("Asha");

    const long = gs.mergeRow(blank(), { stage: "contact", notes: "x".repeat(5000) }, "t", "lead-1234");
    expect(long.notes.length).toBe(2000);
  });

  it("mergeRow re-escapes formula text read back from the sheet", () => {
    // Sheets returns "'=IMPORTXML(1)" as "=IMPORTXML(1)"; writing it back raw would make it a formula.
    const existing = { ...blank(), leadId: "lead-1234", stage: "contact", name: "=IMPORTXML(1)", phone: "+91 98765" };
    const merged = gs.mergeRow(existing, { stage: "product", group: "Solvents" }, "2026-10-28T10:05:00.000Z", "lead-1234");
    expect(merged.name).toBe("'=IMPORTXML(1)");
    expect(merged.phone).toBe("'+91 98765");
    // Idempotent: an already-escaped value is not escaped twice.
    expect(gs.mergeRow(merged, { stage: "quantity" }, "2026-10-28T10:06:00.000Z", "lead-1234").name).toBe("'=IMPORTXML(1)");
    // System fields are left as they are.
    expect(merged.updated).toBe("2026-10-28T10:05:00.000Z");
  });

  it("validLeadId accepts only the UUID shape", () => {
    expect(gs.validLeadId("3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b")).toBe(true);
    expect(gs.validLeadId("3F2B8C1E-9A4D-4E6F-8B7A-1C2D3E4F5A6B")).toBe(true);
    for (const bad of ["lead-1234", "", "3f2b8c1e9a4d4e6f8b7a1c2d3e4f5a6b", "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b-x", "=A1"]) {
      expect(gs.validLeadId(bad), bad).toBe(false);
    }
  });

  it("alertSubject strips line breaks a buyer typed", () => {
    const subject = gs.alertSubject("contact", { ...blank(), name: "Asha\r\nBcc: x@evil.test", company: "Rao\nPaints" });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe("New lead: Asha Bcc: x@evil.test (Rao Paints)");
  });

  it("furthestStage never moves backwards", () => {
    expect(gs.furthestStage("contact", "product")).toBe("product");
    expect(gs.furthestStage("terms", "product")).toBe("terms");
    expect(gs.furthestStage("submitted", "contact")).toBe("submitted");
    expect(gs.furthestStage("quantity", "bogus")).toBe("quantity");
    expect(gs.furthestStage("", "contact")).toBe("contact");
    expect(gs.furthestStage("", "")).toBe("");
  });

  it("alertKind alerts on a new lead and once on completion", () => {
    expect(gs.alertKind("", "contact", true)).toBe("contact");
    expect(gs.alertKind("contact", "product", false)).toBeNull();
    expect(gs.alertKind("terms", "submitted", false)).toBe("submitted");
    expect(gs.alertKind("", "submitted", true)).toBe("submitted");
    expect(gs.alertKind("submitted", "submitted", false)).toBeNull();
  });
});

/**
 * doPost against in-memory stand-ins for the Google services, to check the caps end to end:
 * the sheet is an array of rows, the cache a Map, and sent emails are recorded.
 */
function loadWithFakes() {
  const rows: string[][] = [];
  const cache = new Map<string, string>();
  const mails: string[] = [];
  const warn = vi.fn();
  const matchCase: boolean[] = [];
  const range = (row: number) => ({
    getValues: () => [rows[row - 2] ?? []],
    setNumberFormat() {
      return this;
    },
    setValues: (v: string[][]) => {
      rows[row - 2] = v[0];
    },
  });
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange: (a: string | number) =>
      a === "A:A"
        ? {
            createTextFinder: (id: string) => ({
              matchCase: (on: boolean) => {
                matchCase.push(on);
                return {
              matchEntireCell: () => ({
                findNext: () => {
                  const i = rows.findIndex((r) => r[0] === id);
                  return i === -1 ? null : { getRow: () => i + 2 };
                },
              }),
                };
              },
            }),
          }
        : range(a as number),
  };
  const sandbox = {
    module: { exports: {} as Script & { doPost(e: unknown): { text: string } } },
    console: { ...console, warn, error: vi.fn() },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: {
      getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => void cache.set(k, v) }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, getUrl: () => "https://sheet" }) },
    MailApp: { sendEmail: (_to: string, subject: string) => void mails.push(subject) },
    ContentService: { createTextOutput: (text: string) => ({ setMimeType: () => ({ text }) }), MimeType: { JSON: "json" } },
    Utilities: { getUuid: () => "00000000-0000-4000-8000-000000000000" },
  };
  const code = readFileSync(join(process.cwd(), "apps-script/leads/Code.gs"), "utf8");
  runInNewContext(code, sandbox, { filename: "Code.gs" });
  const post = (body: Record<string, string> | string) =>
    JSON.parse(
      sandbox.module.exports.doPost({
        postData: { type: "text/plain", contents: typeof body === "string" ? body : JSON.stringify(body) },
      }).text,
    ) as { ok: boolean; error?: string };
  return { post, rows, mails, warn, matchCase };
}

describe("Apps Script doPost caps", () => {
  const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
  const lead = (i: number, stage = "contact") => ({ leadId: id(i), stage, name: `Buyer ${i}` });

  it("refuses new leads over MAX_NEW_LEADS_PER_HOUR with rate_limited and appends nothing", () => {
    const { post, rows } = loadWithFakes();
    for (let i = 0; i < 60; i++) expect(post(lead(i))).toEqual({ ok: true });
    expect(post(lead(60))).toEqual({ ok: false, error: "rate_limited" });
    expect(rows).toHaveLength(60);
    // An existing lead can still move on: updates have their own cap.
    expect(post(lead(1, "product"))).toEqual({ ok: true });
  });

  it("refuses updates for one lead over MAX_UPDATES_PER_LEAD_PER_HOUR", () => {
    const { post } = loadWithFakes();
    expect(post(lead(1))).toEqual({ ok: true });
    for (let i = 0; i < 40; i++) expect(post(lead(1, "product"))).toEqual({ ok: true });
    expect(post(lead(1, "quantity"))).toEqual({ ok: false, error: "rate_limited" });
    expect(post(lead(2))).toEqual({ ok: true });
  });

  it("over MAX_ALERT_EMAILS_PER_HOUR saves the row, skips the email and warns", () => {
    const { post, rows, mails, warn } = loadWithFakes();
    for (let i = 0; i < 31; i++) expect(post(lead(i))).toEqual({ ok: true });
    expect(rows).toHaveLength(31);
    expect(mails).toHaveLength(30);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Alert email skipped"));
  });

  it("completed-request alerts are not held back by the hourly alert cap", () => {
    const { post, mails, matchCase } = loadWithFakes();
    for (let i = 0; i < 30; i++) expect(post(lead(i))).toEqual({ ok: true });
    expect(mails).toHaveLength(30);
    // The cap is spent on "New lead" alerts; a completed request still emails.
    expect(post(lead(1, "submitted"))).toEqual({ ok: true });
    expect(mails).toHaveLength(31);
    expect(mails.at(-1)).toMatch(/^Quote request completed/);
    // And completed alerts do not use up the cap for new leads.
    expect(post(lead(30))).toEqual({ ok: true });
    expect(mails).toHaveLength(31);
    // The row lookup is case-sensitive.
    expect(matchCase.every(Boolean) && matchCase.length > 0).toBe(true);
  });

  it("refuses a leadId that is not a UUID", () => {
    const { post, rows } = loadWithFakes();
    expect(post({ leadId: "lead-0001", stage: "contact", name: "Asha" })).toEqual({ ok: false, error: "bad_lead_id" });
    expect(rows).toHaveLength(0);
  });

  it("refuses bodies over 20 KB with bad_request", () => {
    const { post, rows } = loadWithFakes();
    expect(post({ ...lead(1), notes: "x".repeat(20 * 1024) })).toEqual({ ok: false, error: "bad_request" });
    expect(rows).toHaveLength(0);
  });
});
