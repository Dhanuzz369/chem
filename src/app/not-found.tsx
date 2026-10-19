import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { productGroups, products } from "@/content/products";
import { site } from "@/config/site";

// Explicit openGraph replaces (not merges with) the home defaults, so no home og:url leaks onto a 404.
export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist.",
  robots: { index: false, follow: false },
  openGraph: { title: "Page not found", siteName: site.name, type: "website" },
};

export default function NotFound() {
  return (
    <Container className="py-16 md:py-24">
      <div className="max-w-[44rem]">
        <p className="font-mono text-sm text-ink-muted">404</p>
        <h1 className="mt-3 text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Page not found</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
          The page you asked for is not here. It may have moved, or the address may be mistyped. Browse the catalogue, or
          send us a quote request.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/products" size="lg">
            Browse products
          </Button>
          <Button href="/quote" variant="secondary" size="lg">
            Request a quote
          </Button>
        </div>
      </div>

      <section aria-labelledby="nf-groups" className="mt-14 border-t border-line pt-8 md:mt-20">
        <h2 id="nf-groups" className="font-display text-lg font-semibold text-ink">
          Or start from a product group
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {productGroups.map((group) => {
            const count = products.filter((p) => p.group === group).length;
            return (
              <li key={group}>
                <Link
                  href={`/products?group=${group.toLowerCase()}`}
                  className="flex h-14 items-center justify-between rounded-lg border border-line px-4 font-medium text-ink transition-[background-color] duration-(--duration-press) ease-(--ease-out) [@media(hover:hover)]:hover:bg-surface"
                >
                  {group}
                  <span className="font-mono text-sm text-ink-muted">{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </Container>
  );
}
