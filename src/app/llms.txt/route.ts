import { contactRows } from "@/components/ContactDetails";
import { absoluteUrl, site } from "@/config/site";
import { products } from "@/content/products";
import { companySummary } from "@/lib/seo/llms";

export function GET() {
  // Only the details the owner has filled in; nothing is listed while they are empty.
  const contact = contactRows(site.contact);
  const lines = [
    `# ${site.name}`,
    "",
    `> ${companySummary()} ${site.tagline} Product pages give HSN and CAS numbers, applications and packaging; buyers request quotes online.`,
    "",
    `${site.name} can also source and supply chemicals that are not listed. Describe what you need on the quote form: ${absoluteUrl("/quote#other")}`,
    "",
    "## Products",
    "",
    ...products.map(
      (p) => `- [${p.name}](${absoluteUrl(`/products/${p.slug}`)}): HSN ${p.hsn}, ${p.group}`,
    ),
    "",
    "## Pages",
    "",
    `- [All products](${absoluteUrl("/products")}): Browse and search the product list`,
    `- [Request a quote](${absoluteUrl("/quote")}): A short step-by-step form: product, quantity, packaging, destination and FOB/CFR/CIF terms`,
    `- [Blog](${absoluteUrl("/blog")}): Articles about the chemicals we supply`,
    `- [About](${absoluteUrl("/about")}): About ${site.name}`,
    `- [Contact](${absoluteUrl("/contact")}): Get in touch`,
    "",
    ...(contact.length > 0 ? ["## Contact", "", ...contact.map((row) => `- ${row.label}: ${row.value}`), ""] : []),
    "## Optional",
    "",
    `- [Full product reference](${absoluteUrl("/llms-full.txt")}): Every product with HSN and CAS numbers, uses, packaging, hazards and FAQs, in one file`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
