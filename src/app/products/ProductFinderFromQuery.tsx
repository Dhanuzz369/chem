"use client";

import { useSearchParams } from "next/navigation";
import { ProductFinder, parseGroup } from "@/components/ProductFinder";

/** Preselects `?group=<group>` (any case). Lives under Suspense so /products stays static. */
export function ProductFinderFromQuery() {
  const group = parseGroup(useSearchParams().get("group"));
  return <ProductFinder initialGroup={group} syncUrl />;
}
