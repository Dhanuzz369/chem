import Link from "next/link";
import type { PostMeta } from "@/lib/blog";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatPostDate(iso: string) {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

type PostListProps = {
  posts: PostMeta[];
  label: string;
  headingLevel?: 2 | 3;
};

/**
 * A ledger of posts: date in the left column, title and summary on the right. Each row is one
 * link (the title's hit area is stretched over the row), matching the product index rows.
 */
export function PostList({ posts, label, headingLevel = 2 }: PostListProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <ul aria-label={label} className="border-t border-line">
      {posts.map((post) => (
        <li key={post.slug} className="border-b border-line">
          <article className="group relative grid gap-x-10 gap-y-2 py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:py-7">
            <p className="text-sm text-ink-muted tabular-nums md:pt-1">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            </p>
            <div className="min-w-0 max-w-[62ch]">
              <Heading className="font-display text-xl font-semibold leading-snug text-ink md:text-2xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="rounded-sm after:absolute after:inset-0 after:content-[''] [@media(hover:hover)]:group-hover:text-brand-700"
                >
                  {post.title}
                </Link>
              </Heading>
              <p className="mt-2 text-ink-muted">{post.description}</p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
