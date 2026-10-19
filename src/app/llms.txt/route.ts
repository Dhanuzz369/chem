import { absoluteUrl, site } from "@/config/site";
import { products } from "@/content/products";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.tagline} Product information, HSN codes and quote requests for industrial and specialty chemicals.`,
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
    `- [Request a quote](${absoluteUrl("/quote")}): Send an enquiry for one or more products`,
    `- [Blog](${absoluteUrl("/blog")}): Articles about the chemicals we supply`,
    `- [About](${absoluteUrl("/about")}): About ${site.name}`,
    `- [Contact](${absoluteUrl("/contact")}): Get in touch`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
