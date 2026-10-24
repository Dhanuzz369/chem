"use client";

import { useSearchParams } from "next/navigation";
import { ProductFinder, parseGroup, parseQuery } from "@/components/ProductFinder";

/** Preselects `?group=<group>` (any case) and prefills `?q=`. Lives under Suspense so /products stays static. */
export function ProductFinderFromQuery() {
  const params = useSearchParams();
  return <ProductFinder initialGroup={parseGroup(params.get("group"))} initialQuery={parseQuery(params.get("q"))} syncUrl />;
}
