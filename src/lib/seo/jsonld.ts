import { absoluteUrl, site } from "@/config/site";
import type { Faq, Product } from "@/content/products";
import type { PostMeta } from "@/lib/blog";

type JsonLdObject = Record<string, unknown>;

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
    description: site.tagline,
    ...(email && { email }),
    ...(phone && { telephone: phone }),
    ...(address && { address: { "@type": "PostalAddress", streetAddress: address } }),
    ...(contactPoint.length > 0 && { contactPoint }),
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
  };
}

/** No `offers`: the site shows no prices. */
export function productJsonLd(p: Product): JsonLdObject {
  const url = absoluteUrl(`/products/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    description: p.summary,
    url,
    brand: { "@id": absoluteUrl("/#organization") },
    category: p.group,
    ...(p.synonyms.length > 0 && { alternateName: p.synonyms }),
    additionalProperty: [
      { "@type": "PropertyValue", name: "HSN code", value: p.hsn },
      ...p.cas.map((cas) => ({ "@type": "PropertyValue", name: "CAS number", value: cas })),
    ],
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
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    // Posts carry one date; until they are revised, modified equals published.
    dateModified: post.date,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: organization,
    publisher: organization,
    inLanguage: "en",
  };
}
