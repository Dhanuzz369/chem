"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { productGroups, searchProducts, type ProductGroup } from "@/content/products";
import { ProductCard } from "./ProductCard";

/** Matches `?group=solvents` (any case) to a group; anything else means "All". */
export function parseGroup(value: string | null | undefined): ProductGroup | undefined {
  if (!value) return undefined;
  const wanted = value.trim().toLowerCase();
  return productGroups.find((g) => g.toLowerCase() === wanted);
}

const noop = () => () => {};

type ProductFinderProps = {
  /** Chip selected on first render, e.g. from `?group=`. Later changes (a footer link) reselect it. */
  initialGroup?: ProductGroup;
  /** Heading level of each product name. h2 on /products, h3 inside a home section. */
  headingLevel?: 2 | 3;
  /** Keep `?group=` in the address bar in step with the chips, so filtered views can be shared. */
  syncUrl?: boolean;
};

const chipBase =
  "inline-flex h-11 select-none items-center rounded-md border px-4 text-[0.9375rem] font-medium " +
  "transition-[transform,background-color,border-color] duration-(--duration-press) ease-(--ease-out) active:scale-[0.97] " +
  "disabled:pointer-events-none";

/** Group chips and a search box over the catalogue. Results update as you type. */
export function ProductFinder({ initialGroup, headingLevel = 2, syncUrl = false }: ProductFinderProps) {
  const [group, setGroup] = useState<ProductGroup | undefined>(initialGroup);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const hintId = useId();
  // Controls stay disabled until hydrated so nothing typed early is lost; the full list is in the HTML regardless.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  // A new initialGroup (e.g. the footer's ?group= link while already on /products) reselects the chip.
  const [lastInitial, setLastInitial] = useState(initialGroup);
  if (lastInitial !== initialGroup) {
    setLastInitial(initialGroup);
    setGroup(initialGroup);
  }

  const results = searchProducts(query, group);
  const trimmed = query.trim();

  function choose(next: ProductGroup | undefined) {
    setGroup(next);
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("group", next.toLowerCase());
    else url.searchParams.delete("group");
    window.history.replaceState(window.history.state, "", url);
  }

  const status =
    `${results.length} ${results.length === 1 ? "product" : "products"}` +
    (group ? ` in ${group}` : "") +
    (trimmed ? ` matching “${trimmed}”` : "");

  const chips: { label: string; value: ProductGroup | undefined }[] = [
    { label: "All", value: undefined },
    ...productGroups.map((g) => ({ label: g, value: g })),
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-end md:gap-8">
        <div role="group" aria-label="Filter by group" className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const pressed = chip.value === group;
            return (
              <button
                key={chip.label}
                type="button"
                aria-pressed={pressed}
                disabled={!hydrated}
                onClick={() => choose(chip.value)}
                className={`${chipBase} ${
                  pressed
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line-strong bg-bg text-ink [@media(hover:hover)]:hover:border-brand-600 [@media(hover:hover)]:hover:bg-brand-50"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor={searchId} className="text-sm font-medium text-ink">
            Search products
          </label>
          <div className="relative mt-1.5">
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5 14 14" />
            </svg>
            <input
              id={searchId}
              type="search"
              value={query}
              disabled={!hydrated}
              onChange={(e) => setQuery(e.target.value)}
              aria-describedby={hintId}
              placeholder="Name, synonym, HSN or CAS"
              autoComplete="off"
              spellCheck={false}
              className="field-input pl-10"
            />
          </div>
          <p id={hintId} className="sr-only">
            Results update as you type.
          </p>
        </div>
      </div>

      <p role="status" aria-atomic="true" className="mt-8 text-sm text-ink-muted">
        {status}
      </p>

      {/* Column labels for the spec-sheet rows; screen readers get the same labels from each row. */}
      <div
        aria-hidden="true"
        className="mt-3 hidden grid-cols-[minmax(0,1fr)_8rem_7.5rem_10rem_1.25rem] gap-x-6 border-b border-line-strong pb-2 text-xs font-medium text-ink-muted md:grid"
      >
        <span>Product</span>
        <span>Group</span>
        <span>HSN code</span>
        <span>CAS number</span>
        <span />
      </div>

      <ul aria-label="Products" className="mt-3 border-t border-line md:mt-0 md:border-t-0">
        {results.map((p) => (
          <li key={p.slug} className="border-b border-line">
            <ProductCard product={p} headingLevel={headingLevel} />
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <div className="rounded-lg bg-surface p-6">
          <p className="text-ink">
            Nothing in {group ?? "the catalogue"} matches “{trimmed}”. Try a synonym, the first digits of an HSN code, or a CAS number.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                choose(undefined);
              }}
              className="inline-flex h-11 items-center font-medium text-brand-700 underline-offset-4 [@media(hover:hover)]:hover:underline"
            >
              Clear search and filters
            </button>
            <Link
              href="/quote"
              className="inline-flex h-11 items-center font-medium text-brand-700 underline-offset-4 [@media(hover:hover)]:hover:underline"
            >
              Ask for a product we don&apos;t list
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
