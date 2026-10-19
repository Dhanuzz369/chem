"use client";

import { useSearchParams } from "next/navigation";
import { QuoteForm } from "@/components/QuoteForm";

/** Preselects `?product=<slug>`. Lives under Suspense so the rest of /quote stays static. */
export function QuoteFormFromQuery() {
  const product = useSearchParams().get("product");
  return <QuoteForm defaultProducts={product ? [product] : []} />;
}
