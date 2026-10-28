import { productGroups, products } from "@/content/products";
import type { ProductGroup } from "@/content/products";
import { strings } from "./strings";

export type QuantityId = "trial" | "one-container" | "two-to-five" | "monthly" | "not-sure" | "other";
export type PackagingId = "drums" | "ibc" | "bags" | "bulk" | "not-sure";
export type TermsId = "fob" | "cfr" | "cif" | "delivered-india" | "not-sure";

export type Option<Id extends string = string> = { id: Id; label: string; hint?: string };

export const groupOptions: { id: ProductGroup; label: string }[] = productGroups.map((g) => ({ id: g, label: g }));

/** The products in a group (slug + name), then "Any / not sure". */
export function productOptions(group: ProductGroup): { id: string; label: string }[] {
  return [
    ...products.filter((p) => p.group === group).map((p) => ({ id: p.slug, label: p.name })),
    { id: "any", label: strings.productAny },
  ];
}

const quantityIds: QuantityId[] = ["trial", "one-container", "two-to-five", "monthly", "not-sure", "other"];
const packagingIds: PackagingId[] = ["drums", "ibc", "bags", "bulk", "not-sure"];
const termsIds: TermsId[] = ["fob", "cfr", "cif", "delivered-india", "not-sure"];

export const quantityOptions: Option<QuantityId>[] = quantityIds.map((id) => ({ id, label: strings.quantity[id] }));
export const packagingOptions: Option<PackagingId>[] = packagingIds.map((id) => ({ id, label: strings.packaging[id] }));
export const termsOptions: Option<TermsId>[] = termsIds.map((id) => ({ id, ...strings.terms[id] }));

/** Human label for a product slug ("any" → "Any / not sure"); "" for unknown. */
export function productLabel(slug: string): string {
  if (slug === "any") return strings.productAny;
  return products.find((p) => p.slug === slug)?.name ?? "";
}

export function quantityLabel(id: QuantityId | ""): string {
  return id ? strings.quantity[id] : "";
}

export function packagingLabels(ids: readonly PackagingId[]): string {
  return packagingIds.filter((id) => ids.includes(id)).map((id) => strings.packaging[id]).join(", ");
}

export function termsLabel(id: TermsId | ""): string {
  return id ? strings.terms[id].label : "";
}
