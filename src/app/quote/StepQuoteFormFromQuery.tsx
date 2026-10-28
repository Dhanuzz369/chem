"use client";

import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { StepQuoteForm } from "@/components/StepQuoteForm";
import { parsePrefill } from "@/lib/leads/prefill";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

/**
 * Pre-fills from `?product=<slug>`, `?group=<group>` and `#other`. Lives under Suspense, so the
 * rest of /quote stays static; this part renders only in the browser.
 *
 * The hash is read through a store, not once: a client-side link to /quote#other renders this
 * page before the router writes the new URL, and React re-reads the store right after mounting,
 * so "#other" still arrives. Later hash changes by hand (hashchange) arrive the same way.
 */
export function StepQuoteFormFromQuery() {
  const query = useSearchParams().toString();
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  const fromHash = parsePrefill(new URLSearchParams(), hash).answers.group === "other";
  // A new query (a client-side link to another product) starts a fresh form.
  return <StepQuoteForm key={query} initial={parsePrefill(new URLSearchParams(query), hash)} chooseOther={fromHash} />;
}
