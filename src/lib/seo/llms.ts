import { contactRows } from "@/components/ContactDetails";
import { sourcingLine } from "@/components/SourcingCallout";
import { absoluteUrl, site } from "@/config/site";
import { orderingSteps } from "@/content/ordering";
import { productFaqs, productGroups, products, type Product } from "@/content/products";
import { getAllPosts } from "@/lib/blog";

/** One sentence an assistant can quote: who the company is, from the owner's own description. */
export function companySummary(): string {
  return `${site.name} is an exporter and supplier of industrial and specialty chemicals from ${site.origin.country}.`;
}

const list = (items: string[]) => items.map((item) => `- ${item}`);

function productSection(p: Product): string[] {
  return [
    `## ${p.name}`,
    "",
    `- URL: ${absoluteUrl(`/products/${p.slug}`)}`,
    `- HSN code: ${p.hsn}`,
    `- CAS ${p.cas.length > 1 ? "numbers" : "number"}: ${p.cas.join(", ")}`,
    `- Group: ${p.group}`,
    ...(p.synonyms.length > 0 ? [`- Also known as: ${p.synonyms.join(", ")}`] : []),
    "- SDS available on request",
    "",
    p.summary,
    "",
    "### Applications",
    "",
    ...list(p.applications),
    "",
    "### Industries",
    "",
    p.industries.join(", "),
    "",
    "### Packaging",
    "",
    ...list(p.packaging),
    "",
    "### Handling and storage",
    "",
    ...list(p.handling),
    "",
    "### Hazards",
    "",
    ...list(p.hazards),
    "",
    "General hazard information, not a substitute for the safety data sheet.",
    "",
    ...(p.notes && p.notes.length > 0 ? ["### Notes for buyers", "", ...p.notes.flatMap((n) => [n, ""])] : []),
    "### Questions",
    "",
    ...productFaqs(p).flatMap((f) => [`**${f.q}**`, "", f.a, ""]),
  ];
}

/** The whole catalogue as one Markdown file, built from the same data as the pages. */
export function llmsFullText(): string {
  const contact = contactRows(site.contact);
  const posts = getAllPosts();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${companySummary()}`,
    "",
    `Every product is listed with its HSN code and CAS number. Groups: ${productGroups.join(", ")}. SDS available on request for every product.`,
    "",
    `${sourcingLine} ${site.name} can also source and supply chemicals that are not listed: describe what you need on the quote form at ${absoluteUrl("/quote#other")}`,
    "",
    "## How ordering works",
    "",
    ...orderingSteps.map((step, i) => `${i + 1}. **${step.title}.** ${step.body}`),
    "",
    `Request a quote: ${absoluteUrl("/quote")}`,
    "",
    ...(contact.length > 0 ? ["## Contact", "", ...contact.map((row) => `- ${row.label}: ${row.value}`), ""] : []),
    ...products.flatMap(productSection),
    "## Articles",
    "",
    ...posts.map((post) => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.description}`),
    "",
  ];
  return lines.join("\n");
}
