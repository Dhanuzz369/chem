import { afterEach, describe, expect, it, vi } from "vitest";
import { products } from "@/content/products";
import { GET } from "@/app/llms.txt/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

afterEach(() => vi.unstubAllEnvs());

const methanol = products.find((p) => p.slug === "methanol")!;

describe("metadata", () => {
  it("canonical uses SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const m = buildMetadata({ title: "T", description: "D", path: "/products/methanol" });
    expect(m.alternates?.canonical).toBe("https://ex.com/products/methanol");
  });

  it("robots noindex when indexing off", () => {
    vi.stubEnv("ALLOW_INDEXING", "");
    const m = buildMetadata({ title: "T", description: "D", path: "/" });
    expect((m.robots as { index: boolean }).index).toBe(false);
  });

  it("robots index when indexing on", () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    const m = buildMetadata({ title: "T", description: "D", path: "/" });
    expect((m.robots as { index: boolean }).index).toBe(true);
  });
});

describe("json-ld", () => {
  it("productJsonLd has no offers and includes HSN", () => {
    const ld = productJsonLd(methanol) as Record<string, unknown>;
    expect(ld).not.toHaveProperty("offers");
    expect(ld.additionalProperty).toContainEqual(
      expect.objectContaining({ name: "HSN code", value: "29051100" }),
    );
  });

  it("organizationJsonLd omits empty contact", () => {
    const ld = organizationJsonLd() as Record<string, unknown>;
    expect(ld).not.toHaveProperty("contactPoint");
    expect(ld).not.toHaveProperty("email");
    expect(ld).not.toHaveProperty("telephone");
    expect(ld.name).toBe("Goodbiz Chem");
    expect(String(ld.logo)).toMatch(/\/icon\.svg$/);
  });

  it("websiteJsonLd and breadcrumbJsonLd shapes", () => {
    expect((websiteJsonLd() as { "@type": string })["@type"]).toBe("WebSite");
    const b = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]) as {
      itemListElement: { position: number }[];
    };
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it("faqJsonLd shape", () => {
    const ld = faqJsonLd(methanol.faqs) as { "@type": string; mainEntity: unknown[] };
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity.length).toBe(methanol.faqs.length);
  });
});

describe("robots, sitemap, llms.txt", () => {
  it("robots disallows when indexing off", () => {
    vi.stubEnv("ALLOW_INDEXING", "");
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain('"disallow":"/"');
  });

  it("robots allows and lists sitemap when indexing on", () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    vi.stubEnv("SITE_URL", "https://ex.com");
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain('"allow":"/"');
    expect(r.sitemap).toBe("https://ex.com/sitemap.xml");
  });

  it("sitemap lists every product", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const urls = sitemap().map((e) => e.url);
    expect(products).toHaveLength(19);
    for (const p of products) expect(urls).toContain(`https://ex.com/products/${p.slug}`);
  });

  it("llms.txt lists products with HSN", async () => {
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("Goodbiz Chem");
    for (const p of products) {
      expect(text).toContain(p.name);
      expect(text).toContain(p.hsn);
    }
  });
});
