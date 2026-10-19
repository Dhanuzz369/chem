import { afterEach, describe, expect, it, vi } from "vitest";
import { products } from "@/content/products";
import { GET } from "@/app/llms.txt/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { buildMetadata, productMetaDescription } from "@/lib/seo/metadata";
import { absoluteUrl, site } from "@/config/site";
import { getAllPosts } from "@/lib/blog";

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

  it("absoluteUrl joins SITE_URL and a path with exactly one slash", () => {
    vi.stubEnv("SITE_URL", "https://ex.com/");
    expect(absoluteUrl("/products")).toBe("https://ex.com/products");
    expect(absoluteUrl("blog/a")).toBe("https://ex.com/blog/a");
    expect(absoluteUrl("/")).toBe("https://ex.com/");
  });

  it("every product meta description leads with HSN and stays within 160 characters", () => {
    const descriptions = products.map(productMetaDescription);
    for (const [i, d] of descriptions.entries()) {
      const p = products[i];
      expect(d.length, p.slug).toBeLessThanOrEqual(160);
      expect(d.startsWith(`${p.name} (HSN ${p.hsn}) — `), p.slug).toBe(true);
      expect(d.endsWith(". SDS available on request."), p.slug).toBe(true);
    }
    expect(new Set(descriptions).size).toBe(products.length);
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

  it("productJsonLd has its own @id and links the brand to the organization", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const ld = productJsonLd(methanol) as Record<string, unknown>;
    expect(ld["@id"]).toBe("https://ex.com/products/methanol#product");
    expect(ld.brand).toEqual({ "@id": "https://ex.com/#organization" });
    expect(ld.url).toBe("https://ex.com/products/methanol");
  });

  it("organizationJsonLd omits empty contact and includes set contact", () => {
    // Swap the contact block for each case so the test holds whatever the owner has filled in.
    const real = site.contact;
    try {
      site.contact = {};
      const empty = organizationJsonLd() as Record<string, unknown>;
      expect(empty).not.toHaveProperty("contactPoint");
      expect(empty).not.toHaveProperty("email");
      expect(empty).not.toHaveProperty("telephone");
      expect(empty.name).toBe("Goodbiz Chem");
      expect(String(empty.logo)).toMatch(/\/icon\.svg$/);

      site.contact = { email: "sales@example.com", phone: "+1 555 010 0000" };
      const filled = organizationJsonLd() as Record<string, unknown>;
      expect(filled.email).toBe("sales@example.com");
      expect(filled.telephone).toBe("+1 555 010 0000");
      expect(filled.contactPoint).toHaveLength(2);
    } finally {
      site.contact = real;
    }
  });

  it("websiteJsonLd and breadcrumbJsonLd shapes", () => {
    expect((websiteJsonLd() as { "@type": string })["@type"]).toBe("WebSite");
    const b = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }]) as {
      itemListElement: { position: number }[];
    };
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it("blogPostingJsonLd shape", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const post = { slug: "a-post", title: "A post?", description: "D", date: "2026-10-05", products: ["methanol"] };
    const ld = blogPostingJsonLd(post) as Record<string, unknown>;
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "A post?",
      description: "D",
      datePublished: "2026-10-05",
      url: "https://ex.com/blog/a-post",
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://ex.com/blog/a-post" },
      dateModified: "2026-10-05",
      author: { "@type": "Organization", "@id": "https://ex.com/#organization", name: "Goodbiz Chem", url: "https://ex.com/" },
      publisher: { "@type": "Organization", "@id": "https://ex.com/#organization", name: "Goodbiz Chem", url: "https://ex.com/" },
      inLanguage: "en",
    });
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
    for (const p of products) expect(urls).toContain(`https://ex.com/products/${p.slug}`);
  });

  it("sitemap lists every post with its date", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const entries = sitemap();
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      const entry = entries.find((e) => e.url === `https://ex.com/blog/${p.slug}`);
      expect(entry, p.slug).toBeDefined();
      expect(entry!.lastModified).toBe(p.date);
    }
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

  it("llms.txt says chemicals not on the list can be sourced", async () => {
    const text = await (await GET()).text();
    expect(text).toMatch(/source and supply chemicals that are not listed/i);
    expect(text).toContain("/quote#other");
  });

  it("llms.txt has no contact section while contact details are empty", async () => {
    const real = site.contact;
    try {
      site.contact = {};
      const text = await (await GET()).text();
      expect(text).not.toContain("## Contact");
    } finally {
      site.contact = real;
    }
  });

  it("llms.txt lists the contact details that are set", async () => {
    const real = site.contact;
    try {
      site.contact = { email: "sales@example.com", address: "Unit 4, Example Estate, India" };
      const text = await (await GET()).text();
      expect(text).toContain("## Contact\n\n- Email: sales@example.com\n- Address: Unit 4, Example Estate, India\n");
      expect(text).not.toContain("Phone:");
    } finally {
      site.contact = real;
    }
  });
});
