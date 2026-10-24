import { describe, expect, it } from "vitest";
import { finderStatus } from "@/components/ProductFinder";

describe("finderStatus", () => {
  it("shows no count when nothing is filtered", () => {
    expect(finderStatus(19, undefined, "")).toBe("Showing all products.");
    expect(finderStatus(19, undefined, "   ")).toBe("Showing all products.");
  });

  it("counts results once the buyer filters or searches", () => {
    expect(finderStatus(6, "Solvents", "")).toBe("6 products in Solvents");
    expect(finderStatus(1, undefined, "toluene")).toBe("1 product matching “toluene”");
    expect(finderStatus(0, "Amines", " zz ")).toBe("0 products in Amines matching “zz”");
  });
});

describe("parseQuery", () => {
  it("reads ?q= as the initial search, trimmed and length-limited", async () => {
    const { parseQuery } = await import("@/components/ProductFinder");
    expect(parseQuery(null)).toBe("");
    expect(parseQuery("  sles ")).toBe("sles");
    expect(parseQuery("x".repeat(200))).toHaveLength(100);
  });
});
