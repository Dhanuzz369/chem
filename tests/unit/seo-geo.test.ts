import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as llmsFull } from "@/app/llms-full.txt/route";
import { GET as llms } from "@/app/llms.txt/route";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_UPDATED, site } from "@/config/site";
import { exportFaq, productFaqs, products } from "@/content/products";
import { getAllPosts, getPostsForProduct } from "@/lib/blog";
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  productListJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import {
  buildMetadata,
  postOgImagePath,
  postTitle,
  productKeywords,
  productMetaDescription,
  productOgImagePath,
  productTitle,
  verificationMetadata,
} from "@/lib/seo/metadata";
import { bannedPageClaims } from "../helpers/claims";

afterEach(() => vi.unstubAllEnvs());

const BRAND = ` | ${site.name}`;
const methanol = products.find((p) => p.slug === "methanol")!;

/** The product's name, or one of the parts of a compound name such as "DCM / Methylene Chloride", or a synonym. */
function nameForms(p: (typeof products)[number]) {
  return [p.name, ...p.name.split(/\s*[/()]\s*/).filter((part) => part.length > 2), ...p.synonyms];
}

describe("site.origin", () => {
  it("is one config value for the export country", () => {
    expect(site.origin).toEqual({ country: "India", countryCode: "IN", locality: "Bengaluru", region: "Karnataka" });
    expect(SITE_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("product titles", () => {
  it("every product title with the brand is at most 60 characters and names the product, HSN and Exporter", () => {
    for (const p of products) {
      const title = productTitle(p);
      const full = `${title}${BRAND}`;
      expect(full.length, `${p.slug}: ${full}`).toBeLessThanOrEqual(60);
      expect(title, p.slug).toContain(p.hsn);
      expect(title, p.slug).toContain("Exporter");
      if (p.seoTitle) expect(nameForms(p).some((n) => title.includes(n)), p.slug).toBe(true);
      else expect(title, p.slug).toContain(p.name);
    }
  });

  it("prefers the long pattern and falls back when it does not fit", () => {
    expect(productTitle(methanol)).toBe("Methanol Exporter & Supplier, HSN 29051100");
    const ethyl = products.find((p) => p.slug === "ethyl-acetate")!;
    expect(productTitle(ethyl)).toBe("Ethyl Acetate Exporter, HSN 29153100");
  });

  it("every product title is unique", () => {
    const titles = products.map(productTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("names no claims", () => {
    for (const p of products) expect(productTitle(p)).not.toMatch(bannedPageClaims);
  });
});

describe("product meta descriptions", () => {
  it("lead with HSN, say exporter from the origin country and stay within 160 characters", () => {
    for (const p of products) {
      const d = productMetaDescription(p);
      expect(d.length, `${p.slug}: ${d.length}`).toBeLessThanOrEqual(160);
      expect(d.startsWith(`${p.name} (HSN ${p.hsn}) — `), p.slug).toBe(true);
      expect(d, p.slug).toContain(`Exporter from ${site.origin.country}.`);
      expect(d.endsWith(". SDS available on request."), p.slug).toBe(true);
    }
  });
});

describe("product keywords", () => {
  it("are built from the product's own data, deduplicated and capped", () => {
    const k = productKeywords(methanol);
    expect(k).toEqual(
      expect.arrayContaining([
        "Methanol",
        "Methanol exporter",
        "Methanol supplier",
        "Methanol exporter India",
        "Methanol HSN code",
        "HSN 29051100",
        "67-56-1",
        "Methanol bulk",
        "Methyl alcohol",
      ]),
    );
    expect(k.length).toBeLessThanOrEqual(15);
    expect(new Set(k.map((s) => s.toLowerCase())).size).toBe(k.length);
  });

  it("use the plain chemical name for phrases on compound names", () => {
    const dcm = products.find((p) => p.slug === "methylene-chloride")!;
    const k = productKeywords(dcm);
    expect(k[0]).toBe("DCM / Methylene Chloride");
    expect(k).toContain("Methylene Chloride exporter");
    expect(k).not.toContain("DCM / Methylene Chloride exporter");
  });

  it("every product's keywords include its HSN and every CAS number within the cap", () => {
    for (const p of products) {
      const k = productKeywords(p);
      expect(k.length, p.slug).toBeLessThanOrEqual(15);
      expect(k, p.slug).toContain(`HSN ${p.hsn}`);
      for (const cas of p.cas) expect(k, p.slug).toContain(cas);
    }
  });

  it("buildMetadata renders keywords only when given", () => {
    expect(buildMetadata({ title: "T", description: "D", path: "/", keywords: ["a", "b"] }).keywords).toEqual(["a", "b"]);
    expect(buildMetadata({ title: "T", description: "D", path: "/" })).not.toHaveProperty("keywords");
  });
});

describe("open graph images", () => {
  it("buildMetadata uses the given image and alt for Open Graph and Twitter", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const m = buildMetadata({
      title: "T",
      description: "D",
      path: "/products/methanol",
      image: productOgImagePath("methanol"),
      imageAlt: "Methanol (HSN 29051100) | Goodbiz Chem",
    });
    const og = (m.openGraph?.images as { url: string; alt: string }[])[0];
    expect(og.url).toBe("https://ex.com/products/methanol/opengraph-image/card");
    expect(og.alt).toBe("Methanol (HSN 29051100) | Goodbiz Chem");
    expect((m.twitter as { images: string[] }).images).toEqual(["https://ex.com/products/methanol/opengraph-image/card"]);
  });

  it("post images live under the post", () => {
    expect(postOgImagePath("a-post")).toBe("/blog/a-post/opengraph-image/card");
  });

  it("buildMetadata can set an absolute title", () => {
    expect(buildMetadata({ title: "Home | Brand", description: "D", path: "/", absoluteTitle: true }).title).toEqual({
      absolute: "Home | Brand",
    });
  });
});

describe("blog titles", () => {
  it("every post title with the brand is at most 60 characters", () => {
    for (const post of getAllPosts()) {
      expect(`${postTitle(post)}${BRAND}`.length, post.slug).toBeLessThanOrEqual(60);
    }
  });
});

describe("export FAQ", () => {
  it("is generated from the product, added once to its FAQs, and makes no promises", () => {
    const faq = exportFaq(methanol);
    expect(faq.q).toBe("Do you export Methanol?");
    expect(faq.a).toBe(
      "Yes. Goodbiz Chem exports and supplies Methanol (HSN 29051100). Send a quote request with quantity, packaging and destination port; SDS available on request.",
    );
    const all = productFaqs(methanol);
    expect(all).toHaveLength(methanol.faqs.length + 1);
    expect(all.at(-1)).toEqual(faq);
    for (const p of products) expect(exportFaq(p).a).not.toMatch(bannedPageClaims);
  });
});

describe("related content", () => {
  it("every product links at least 2 real related products", () => {
    const slugs = new Set(products.map((p) => p.slug));
    for (const p of products) {
      const related = p.related.filter((s) => slugs.has(s) && s !== p.slug);
      expect(related.length, p.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("getPostsForProduct returns the posts that list the product", () => {
    const posts = getPostsForProduct("methanol");
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) expect(post.products).toContain("methanol");
    expect(getPostsForProduct("not-a-product")).toEqual([]);
  });
});

describe("json-ld", () => {
  function allBlocks() {
    const posts = getAllPosts();
    return [
      organizationJsonLd(),
      websiteJsonLd(),
      productListJsonLd(products),
      breadcrumbJsonLd([{ name: "Home", path: "/" }]),
      ...products.map((p) => productJsonLd(p, getPostsForProduct(p.slug))),
      ...products.map((p) => faqJsonLd(productFaqs(p))),
      ...posts.map((post) => blogPostingJsonLd(post)),
    ];
  }

  it("every block survives JSON and has @context and @type", () => {
    for (const block of allBlocks()) {
      const parsed = JSON.parse(JSON.stringify(block)) as Record<string, unknown>;
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(typeof parsed["@type"]).toBe("string");
    }
  });

  it("no block anywhere has a price, offers on a product or a rating", () => {
    const text = JSON.stringify(allBlocks());
    expect(text).not.toMatch(/"price"|"priceCurrency"|"aggregateRating"|"review"/);
    for (const p of products) expect(productJsonLd(p)).not.toHaveProperty("offers");
  });

  it("product has image, category, sku, related products and the posts that mention it", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const posts = getPostsForProduct("methanol");
    const ld = productJsonLd(methanol, posts) as Record<string, unknown>;
    expect(ld.image).toBe("https://ex.com/products/methanol/opengraph-image/card");
    expect(ld.category).toBe("Solvents");
    expect(ld.sku).toBe("methanol");
    expect(ld.isRelatedTo).toEqual(
      methanol.related.map((s) => ({
        "@type": "Product",
        "@id": `https://ex.com/products/${s}#product`,
        name: products.find((p) => p.slug === s)!.name,
        url: `https://ex.com/products/${s}`,
      })),
    );
    expect(ld.subjectOf).toEqual(
      posts.map((post) => ({
        "@type": "BlogPosting",
        "@id": `https://ex.com/blog/${post.slug}#article`,
        headline: post.title,
        url: `https://ex.com/blog/${post.slug}`,
      })),
    );
    expect(productJsonLd(products.find((p) => p.slug === "diisopropylamine")!, [])).not.toHaveProperty("subjectOf");
  });

  it("product list is an ItemList of every product in order", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const ld = productListJsonLd(products) as { "@type": string; itemListElement: Record<string, unknown>[] };
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.itemListElement).toHaveLength(products.length);
    expect(ld.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      url: `https://ex.com/products/${products[0].slug}`,
      name: products[0].name,
    });
  });

  it("organization keeps its @id and logo and adds country, knowsAbout and an offer catalogue without prices", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const ld = organizationJsonLd() as Record<string, unknown>;
    expect(ld["@id"]).toBe("https://ex.com/#organization");
    expect(ld.logo).toBe("https://ex.com/icon.svg");
    expect(ld.image).toBe("https://ex.com/og-default.png");
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    });
    expect(ld.knowsAbout).toEqual(expect.arrayContaining(["Solvents", "Surfactants", "Methanol", "LABSA"]));
    const catalog = ld.hasOfferCatalog as { "@type": string; itemListElement: Record<string, unknown>[] };
    expect(catalog["@type"]).toBe("OfferCatalog");
    expect(catalog.itemListElement).toHaveLength(products.length);
    expect(catalog.itemListElement[0]).toEqual({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        "@id": `https://ex.com/products/${products[0].slug}#product`,
        name: products[0].name,
        url: `https://ex.com/products/${products[0].slug}`,
      },
    });
    expect(ld).not.toHaveProperty("makesOffer");
  });

  it("organization address is Bengaluru, Karnataka, India, with no street", () => {
    const real = site.contact;
    try {
      site.contact = { address: "Unit 4, Example Estate" };
      expect((organizationJsonLd() as Record<string, unknown>).address).toEqual({
        "@type": "PostalAddress",
        addressLocality: "Bengaluru",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      });
    } finally {
      site.contact = real;
    }
  });

  it("website has a product search action", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const ld = websiteJsonLd() as Record<string, unknown>;
    expect(ld.potentialAction).toEqual({
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://ex.com/products?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    });
  });

  it("blog posting has an @id and its OG image", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const post = getAllPosts()[0];
    const ld = blogPostingJsonLd(post) as Record<string, unknown>;
    expect(ld["@id"]).toBe(`https://ex.com/blog/${post.slug}#article`);
    expect(ld.image).toBe(`https://ex.com/blog/${post.slug}/opengraph-image/card`);
  });
});

describe("robots", () => {
  const AI_CRAWLERS = [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "Bingbot",
  ];

  it("allows everyone and names the AI crawlers when indexing is on", () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    vi.stubEnv("SITE_URL", "https://ex.com");
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules).toContainEqual({ userAgent: "*", allow: "/" });
    const agents = rules.flatMap((rule) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]));
    for (const bot of AI_CRAWLERS) expect(agents, bot).toContain(bot);
    for (const rule of rules) expect(rule).not.toHaveProperty("disallow");
    expect(r.sitemap).toBe("https://ex.com/sitemap.xml");
  });

  it("disallows everything, AI crawlers included, when indexing is off", () => {
    vi.stubEnv("ALLOW_INDEXING", "");
    const r = robots();
    expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(r).not.toHaveProperty("sitemap");
  });
});

describe("sitemap", () => {
  it("dates products with SITE_UPDATED and lists their OG image", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const entries = sitemap();
    for (const p of products) {
      const e = entries.find((x) => x.url === `https://ex.com/products/${p.slug}`)!;
      expect(e.lastModified, p.slug).toBe(SITE_UPDATED);
      expect(e.images, p.slug).toEqual([`https://ex.com/products/${p.slug}/opengraph-image/card`]);
      expect(e.priority).toBeGreaterThan(0);
      expect(e.changeFrequency).toBeDefined();
    }
  });

  it("lists the hero image on the home page", () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const home = sitemap().find((x) => x.url === "https://ex.com/")!;
    expect(home.images).toEqual(["https://ex.com/hero-fallback.webp"]);
    expect(home.priority).toBe(1);
  });
});

describe("llms.txt and llms-full.txt", () => {
  it("llms.txt links the full version under Optional", async () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const text = await (await llms()).text();
    expect(text).toContain("## Optional");
    expect(text).toContain("https://ex.com/llms-full.txt");
  });

  it("llms-full.txt has every product's name, HSN, CAS, FAQs and URL, the company summary and the posts", async () => {
    vi.stubEnv("SITE_URL", "https://ex.com");
    const res = await llmsFull();
    expect(res.headers.get("Content-Type")).toMatch(/text\/(plain|markdown)/);
    const text = await res.text();
    expect(text.startsWith(`# ${site.name}`)).toBe(true);
    expect(text).toContain(site.origin.country);
    expect(text).toMatch(/source and supply chemicals that are not listed/i);
    for (const p of products) {
      expect(text, p.slug).toContain(`## ${p.name}`);
      expect(text, p.slug).toContain(p.hsn);
      for (const cas of p.cas) expect(text, p.slug).toContain(cas);
      expect(text, p.slug).toContain(`https://ex.com/products/${p.slug}`);
      expect(text, p.slug).toContain(p.applications[0]);
      expect(text, p.slug).toContain(p.hazards[0]);
      expect(text, p.slug).toContain(exportFaq(p).q);
    }
    for (const post of getAllPosts()) {
      expect(text).toContain(post.title);
      expect(text).toContain(`https://ex.com/blog/${post.slug}`);
    }
    expect(text).not.toMatch(bannedPageClaims);
    expect(text).not.toMatch(/\b(best|top)\b/i);
  });
});

describe("manifest and verification", () => {
  it("manifest names the site and uses the brand colour and icon", () => {
    const m = manifest();
    expect(m.name).toBe(site.name);
    expect(m.short_name).toBe(site.name);
    expect(m.theme_color).toBe("#176140");
    expect(m.background_color).toBe("#ffffff");
    expect(m.icons).toEqual([{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]);
  });

  it("verification tags render only when their env vars are set", () => {
    expect(verificationMetadata({})).toBeUndefined();
    expect(verificationMetadata({ GOOGLE_SITE_VERIFICATION: " g-token " })).toEqual({ google: "g-token" });
    expect(verificationMetadata({ BING_SITE_VERIFICATION: "b-token" })).toEqual({ other: { "msvalidate.01": "b-token" } });
    expect(verificationMetadata({ GOOGLE_SITE_VERIFICATION: "g", BING_SITE_VERIFICATION: "b" })).toEqual({
      google: "g",
      other: { "msvalidate.01": "b" },
    });
  });
});
