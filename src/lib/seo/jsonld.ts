import { absoluteUrl, site } from "@/config/site";
import { productGroups, products, type Faq, type Product } from "@/content/products";
import type { PostMeta } from "@/lib/blog";
import { DEFAULT_OG_IMAGE, postOgImagePath, productOgImagePath } from "@/lib/seo/metadata";

type JsonLdObject = Record<string, unknown>;

const productId = (slug: string) => `${absoluteUrl(`/products/${slug}`)}#product`;
const postId = (slug: string) => `${absoluteUrl(`/blog/${slug}`)}#article`;

export function organizationJsonLd(): JsonLdObject {
  const { email, phone, whatsapp, address } = site.contact;
  const contactPoint = [
    email && { "@type": "ContactPoint", contactType: "sales", email },
    phone && { "@type": "ContactPoint", contactType: "sales", telephone: phone },
    whatsapp && { "@type": "ContactPoint", contactType: "sales", telephone: whatsapp },
  ].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: site.tagline,
    // Country only: no street or city is invented. A street address is added once the owner sets one.
    address: {
      "@type": "PostalAddress",
      ...(address && { streetAddress: address }),
      addressCountry: site.origin.countryCode,
    },
    ...(email && { email }),
    ...(phone && { telephone: phone }),
    ...(contactPoint.length > 0 && { contactPoint }),
    knowsAbout: [...productGroups, ...products.map((p) => p.name)],
    // An OfferCatalog of priceless Offers rather than makesOffer: the site shows no prices, and this is
    // schema.org's own shape for "the things this seller offers". See the change-2 report for the reasoning.
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Industrial and specialty chemicals",
      itemListElement: products.map((p) => ({ "@type": "Offer", itemOffered: { "@id": productId(p.slug) } })),
    },
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: site.name,
    url: absoluteUrl("/"),
    description: site.tagline,
    inLanguage: "en",
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/products?q={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };
}

/** No `offers`, price or rating: the site shows no prices. `posts` are the blog posts that mention it. */
export function productJsonLd(p: Product, posts: PostMeta[] = []): JsonLdObject {
  const url = absoluteUrl(`/products/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productId(p.slug),
    name: p.name,
    description: p.summary,
    url,
    image: absoluteUrl(productOgImagePath(p.slug)),
    sku: p.slug,
    brand: { "@id": absoluteUrl("/#organization") },
    category: p.group,
    ...(p.synonyms.length > 0 && { alternateName: p.synonyms }),
    additionalProperty: [
      { "@type": "PropertyValue", name: "HSN code", value: p.hsn },
      ...p.cas.map((cas) => ({ "@type": "PropertyValue", name: "CAS number", value: cas })),
    ],
    ...(p.related.length > 0 && { isRelatedTo: p.related.map((slug) => ({ "@id": productId(slug) })) }),
    ...(posts.length > 0 && {
      subjectOf: posts.map((post) => ({
        "@type": "BlogPosting",
        "@id": postId(post.slug),
        headline: post.title,
        url: absoluteUrl(`/blog/${post.slug}`),
      })),
    }),
  };
}

/** The catalogue as an ordered list, for /products. */
export function productListJsonLd(list: Pick<Product, "slug" | "name">[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} products`,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };
}

export function faqJsonLd(faqs: Faq[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingJsonLd(post: PostMeta): JsonLdObject {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const organization = {
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    url: absoluteUrl("/"),
  };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": postId(post.slug),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    // Posts carry one date; until they are revised, modified equals published.
    dateModified: post.date,
    url,
    image: absoluteUrl(postOgImagePath(post.slug)),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: organization,
    publisher: organization,
    inLanguage: "en",
  };
}
