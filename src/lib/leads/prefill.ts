import { productGroups, products } from "@/content/products";
import type { Answers, StepId } from "./steps";

/**
 * Pre-fill from a link. Only exact, known values are used; anything else is ignored.
 * - ?product=<slug> → that product and its own group; skips the group and product steps.
 * - ?group=<group>  → that group; skips the group step.
 * - ?group=other or #other → "Something else" chosen, nothing skipped (its text box still needs filling).
 */
export function parsePrefill(params: URLSearchParams, hash?: string): { answers: Partial<Answers>; skip: StepId[] } {
  const slug = params.get("product");
  const product = slug ? products.find((p) => p.slug === slug) : undefined;
  if (product) return { answers: { group: product.group, product: product.slug }, skip: ["group", "product"] };

  const groupParam = (params.get("group") ?? "").trim().toLowerCase();
  const group = productGroups.find((g) => g.toLowerCase() === groupParam);
  if (group) return { answers: { group }, skip: ["group"] };

  if (groupParam === "other" || (hash ?? "").replace(/^#/, "").toLowerCase() === "other") {
    return { answers: { group: "other" }, skip: [] };
  }
  return { answers: {}, skip: [] };
}
