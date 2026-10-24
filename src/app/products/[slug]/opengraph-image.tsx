import { getProduct, products } from "@/content/products";
import { productOgImageAlt } from "@/lib/seo/metadata";
import { OG_ID, ogContentType, ogSize, productCard } from "@/lib/seo/og-card";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

// One card per product, with alt text naming the product, so it is generated per page rather than fixed.
export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const product = getProduct((await params).slug);
  if (!product) return [];
  return [{ id: OG_ID, alt: productOgImageAlt(product), size: ogSize, contentType: ogContentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) return new Response("Not found", { status: 404 });
  return productCard(product);
}
