import { getAllPosts } from "@/lib/blog";
import { blogFeed } from "@/lib/seo/rss";

export function GET() {
  return new Response(blogFeed(getAllPosts()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
