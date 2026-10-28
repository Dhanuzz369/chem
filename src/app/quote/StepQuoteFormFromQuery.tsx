"use client";

import { useSearchParams } from "next/navigation";
import { StepQuoteForm } from "@/components/StepQuoteForm";
import { parsePrefill } from "@/lib/leads/prefill";

/**
 * Pre-fills from `?product=<slug>`, `?group=<group>` and `#other`. Lives under Suspense, so the
 * rest of /quote stays static; this part renders only in the browser, where the hash is readable.
 */
export function StepQuoteFormFromQuery() {
  const query = useSearchParams().toString();
  const hash = typeof window === "undefined" ? "" : window.location.hash;
  // A new query (a client-side link to another product) starts a fresh form.
  return <StepQuoteForm key={query} initial={parsePrefill(new URLSearchParams(query), hash)} />;
}
