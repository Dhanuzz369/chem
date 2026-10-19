import { describe, expect, it } from "vitest";
import {
  getProduct,
  productGroups,
  products,
  searchProducts,
  type Product,
} from "@/content/products";

const specTable: [string, string, Product["group"]][] = [
  ["ethyl-acetate", "29153100", "Solvents"],
  ["methanol", "29051100", "Solvents"],
  ["isopropyl-alcohol", "29051220", "Solvents"],
  ["methylene-chloride", "29031200", "Solvents"],
  ["toluene", "29023000", "Solvents"],
  ["n-heptane-hexane", "29011000", "Solvents"],
  ["diisopropylamine", "29211990", "Amines"],
  ["titanium-dioxide", "282300", "Inorganics"],
  ["caustic-soda-flakes", "281511", "Inorganics"],
  ["liquid-caustic-soda", "281512", "Inorganics"],
  ["copper-sulphate", "283325", "Inorganics"],
  ["labsa", "340231", "Surfactants"],
  ["sles-70", "340239", "Surfactants"],
  ["sles-28", "340239", "Surfactants"],
  ["sodium-lauryl-sulphate", "340239", "Surfactants"],
  ["alpha-olefin-sulphonate", "340239", "Surfactants"],
  ["sodium-lauryl-sulphoacetate", "340239", "Surfactants"],
  ["alcohol-ethoxylates", "340242", "Surfactants"],
  ["nonylphenol-ethoxylates", "340242", "Surfactants"],
];

function allText(p: Product): string[] {
  return [
    p.name,
    p.summary,
    p.form,
    ...p.synonyms,
    ...p.applications,
    ...p.industries,
    ...p.packaging,
    ...p.handling,
    ...p.hazards,
    ...(p.notes ?? []),
    ...p.faqs.flatMap((f) => [f.q, f.a]),
  ];
}

describe("product catalogue", () => {
  it("has 19 products with spec HSN codes", () => {
    expect(products.map((p) => [p.slug, p.hsn, p.group])).toEqual(specTable);
  });

  it("slugs are url-safe and unique", () => {
    for (const p of products) expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    expect(new Set(products.map((p) => p.slug)).size).toBe(19);
  });

  it("lists the groups in navigation order", () => {
    expect(productGroups).toEqual(["Solvents", "Amines", "Inorganics", "Surfactants"]);
  });

  it("every product is substantive", () => {
    const slugs = new Set(products.map((p) => p.slug));
    for (const p of products) {
      expect(p.summary.length, p.slug).toBeGreaterThanOrEqual(120);
      expect(p.summary.length, p.slug).toBeLessThanOrEqual(320);
      expect(p.applications.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.faqs.length, p.slug).toBeGreaterThanOrEqual(4);
      expect(p.handling.length, p.slug).toBeGreaterThanOrEqual(2);
      expect(p.hazards.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(p.cas.length, p.slug).toBeGreaterThanOrEqual(1);
      expect(p.related.length, p.slug).toBeGreaterThanOrEqual(1);
      for (const r of p.related) {
        expect(slugs.has(r), `${p.slug} -> ${r}`).toBe(true);
        expect(r).not.toBe(p.slug);
      }
    }
  });

  it("no near-duplicate summaries", () => {
    const summaries = products.map((p) => p.summary.trim().toLowerCase());
    expect(new Set(summaries).size).toBe(summaries.length);
  });

  it("npe notes EU restriction", () => {
    expect(getProduct("nonylphenol-ethoxylates")!.notes!.join(" ")).toMatch(/EU/);
  });

  it("no invented claims", () => {
    const banned = /certified|ISO \d|since \d{4}|years of experience|REACH[- ]compliant|guarantee/i;
    for (const p of products) {
      for (const t of allText(p)) expect(t, p.slug).not.toMatch(banned);
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProduct("not-a-product")).toBeUndefined();
    expect(getProduct("toluene")?.name).toBe("Toluene");
  });

  it("searchProducts matches partial HSN and case-insensitive name", () => {
    expect(searchProducts("3402").length).toBe(8);
    const sles = searchProducts("sles").map((p) => p.slug);
    expect(sles).toContain("sles-70");
    expect(sles).toContain("sles-28");
    expect(searchProducts("", "Amines").map((p) => p.slug)).toEqual(["diisopropylamine"]);
    expect(searchProducts("methylene").map((p) => p.slug)).toContain("methylene-chloride");
    expect(searchProducts("DICHLOROMETHANE").map((p) => p.slug)).toEqual(["methylene-chloride"]);
    expect(searchProducts("67-56-1").map((p) => p.slug)).toEqual(["methanol"]);
  });
});
