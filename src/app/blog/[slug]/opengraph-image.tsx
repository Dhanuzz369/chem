import { getAllPosts, getPost } from "@/lib/blog";
import { OG_ID, ogContentType, ogSize, postCard } from "@/lib/seo/og-card";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const post = getPost((await params).slug);
  if (!post) return [];
  return [{ id: OG_ID, alt: post.title, size: ogSize, contentType: ogContentType }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) return new Response("Not found", { status: 404 });
  return postCard(post);
}
