import { describe, expect, it } from "vitest";
import { parsePrefill } from "@/lib/leads/prefill";

const p = (q: string, hash?: string) => parsePrefill(new URLSearchParams(q), hash);

describe("parsePrefill", () => {
  it("a product pre-fills its group and product and skips both steps", () => {
    expect(p("?product=methanol")).toEqual({
      answers: { group: "Solvents", product: "methanol" },
      skip: ["group", "product"],
    });
  });

  it("a group pre-fills and skips the group step only", () => {
    expect(p("?group=surfactants")).toEqual({ answers: { group: "Surfactants" }, skip: ["group"] });
    expect(p("?group=Amines")).toEqual({ answers: { group: "Amines" }, skip: ["group"] });
  });

  it("something else is chosen but never skipped", () => {
    expect(p("?group=other")).toEqual({ answers: { group: "other" }, skip: [] });
    expect(p("", "#other")).toEqual({ answers: { group: "other" }, skip: [] });
  });

  it("parsePrefill ignores unknown and mismatched values", () => {
    const none = { answers: {}, skip: [] };
    expect(p("?product=%3Cscript%3Ealert(1)%3C%2Fscript%3E")).toEqual(none);
    expect(p("?product=<script>")).toEqual(none);
    expect(p("?product=nope")).toEqual(none);
    expect(p("?group=../x")).toEqual(none);
    expect(p("?group=__proto__&product=constructor")).toEqual(none);
    expect(p("", "#nothing")).toEqual(none);
    expect(p("?product=methanol&group=Amines")).toEqual({
      answers: { group: "Solvents", product: "methanol" },
      skip: ["group", "product"],
    });
    expect(p("?product=nope&group=amines")).toEqual({ answers: { group: "Amines" }, skip: ["group"] });
  });
});
