import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { groupSwatch } from "@/components/ProductCard";
import { formatPostDate } from "@/components/PostList";
import { getProduct, products as allProducts, type Product } from "@/content/products";
import { getAllPosts, getPost } from "@/lib/blog";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, postKeywords, postOgImagePath, postTitle } from "@/lib/seo/metadata";

// Same as the product pages: unknown slugs get a real 404 status on first request.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) return {};
  return buildMetadata({
    title: postTitle(post),
    description: post.description,
    path: `/blog/${post.slug}`,
    image: postOgImagePath(post.slug),
    imageAlt: post.title,
    keywords: postKeywords(post, allProducts),
    type: "article",
  });
}

function ArticleProducts({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="article-products" className="rounded-lg border border-line bg-surface p-5 md:p-6">
      <h2 id="article-products" className="font-body text-sm font-medium tracking-normal text-ink-muted">
        Products in this article
      </h2>
      <ul className="mt-3 divide-y divide-line border-t border-line">
        {products.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/products/${p.slug}`}
              className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-ink"
            >
              <span className="min-w-0 font-medium [@media(hover:hover)]:group-hover:text-brand-700">{p.name}</span>
              <span className={`shrink-0 rounded-sm px-2 py-0.5 font-mono text-[0.8125rem] tabular-nums ${groupSwatch[p.group]}`}>
                {p.hsn}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-muted">SDS available on request for each product.</p>
    </section>
  );
}

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const products = post.products.map(getProduct).filter((p): p is Product => Boolean(p));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <Container className="pt-8 pb-16 md:pt-12 md:pb-24">
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <header className="border-b border-line pb-8">
            <h1 className="max-w-[24ch] text-[clamp(2.125rem,2.4vw+1.25rem,3.25rem)] font-semibold text-ink">
              {post.title}
            </h1>
            <p className="mt-4 text-sm text-ink-muted">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span aria-hidden="true"> · </span>
              {post.readingMinutes} min read
            </p>
          </header>

          <div className="prose-article mt-8" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>

        <aside className="lg:pt-2">
          <div className="grid gap-6 lg:sticky lg:top-28">
            {products.length > 0 && <ArticleProducts products={products} />}
            <section aria-labelledby="article-quote" className="rounded-lg bg-brand-100 p-5 md:p-6">
              <h2 id="article-quote" className="text-xl font-semibold text-ink">
                Need a price?
              </h2>
              <p className="mt-2 text-[0.9375rem] text-ink">
                Tell us the products, quantity, packaging and destination.
              </p>
              <Button href="/quote" className="mt-4 w-full">
                Request a quote
              </Button>
            </section>
          </div>
        </aside>
      </div>

      <JsonLd data={[blogPostingJsonLd(post), breadcrumbJsonLd(crumbs)]} />
    </Container>
  );
}
