import Link from "next/link";
import type { Product, ProductGroup } from "@/content/products";

/** One pastel per group (see docs/design/direction.md). Backgrounds only; text on them is ink. */
export const groupSwatch: Record<ProductGroup, string> = {
  Solvents: "bg-accent-sky",
  Amines: "bg-accent-lilac",
  Inorganics: "bg-accent-butter",
  Surfactants: "bg-accent-mint",
};

type ProductCardProps = {
  product: Pick<Product, "slug" | "name" | "hsn" | "group" | "cas" | "synonyms">;
  headingLevel?: 2 | 3 | 4;
};

/**
 * A spec-sheet row: name and synonyms, group, HSN code and CAS numbers. The whole
 * row is one link. The grid columns line up with the header row in ProductFinder.
 */
export function ProductCard({ product, headingLevel = 3 }: ProductCardProps) {
  const Heading = `h${headingLevel}` as const;
  const aka = product.synonyms.slice(0, 3).join(" · ");
  return (
    <article className="group relative grid gap-x-6 gap-y-2 py-4 md:grid-cols-[minmax(0,1fr)_8rem_7.5rem_10rem_1.25rem] md:items-center md:py-3.5">
      <div className="min-w-0">
        <Heading className="font-display text-lg font-semibold leading-snug text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="rounded-sm after:absolute after:inset-0 after:content-[''] [@media(hover:hover)]:group-hover:text-brand-700"
          >
            {product.name}
          </Link>
        </Heading>
        {aka && <p className="mt-0.5 truncate text-sm text-ink-muted">{aka}</p>}
      </div>

      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm md:contents">
        <div>
          <dt className="sr-only">Group</dt>
          <dd className="text-ink-muted">{product.group}</dd>
        </div>
        <div>
          <dt className="sr-only">HSN code</dt>
          <dd>
            <span className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[0.8125rem] text-ink tabular-nums ${groupSwatch[product.group]}`}>
              <span aria-hidden="true" className="md:hidden">HSN </span>
              {product.hsn}
            </span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="sr-only">CAS number</dt>
          <dd className="font-mono text-[0.8125rem] text-ink-muted tabular-nums">
            <span aria-hidden="true" className="font-body md:hidden">CAS </span>
            {product.cas[0]}
            {product.cas.length > 1 && <span className="font-body"> +{product.cas.length - 1}</span>}
          </dd>
        </div>
      </dl>

      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden text-brand-700 transition-transform duration-(--duration-press) ease-(--ease-out) md:block [@media(hover:hover)]:group-hover:translate-x-0.5"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </article>
  );
}
