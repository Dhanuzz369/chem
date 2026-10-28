import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
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
