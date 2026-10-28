import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { StepQuoteForm } from "@/components/StepQuoteForm";
import { site } from "@/config/site";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { StepQuoteFormFromQuery } from "./StepQuoteFormFromQuery";

export const metadata = buildMetadata({
  title: "Request a Quote for Industrial Chemicals",
  description:
    "Ask Goodbiz Chem for a quote on solvents, amines, inorganics and surfactants. Tell us the product, quantity, packaging and destination.",
  path: "/quote",
  keywords: ["chemical quote", "bulk chemical enquiry", "industrial chemicals supplier", `chemical exporter ${site.origin.country}`],
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Request a quote", path: "/quote" },
];

const checklist = [
  "The product, and any grade or specification you need",
  "Quantity and the packaging you prefer",
  "The destination port or delivery city",
  "Any documents you need with the shipment",
];

export default function QuotePage() {
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 max-w-[44rem]">
        <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Request a quote</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
          Tell us what you need and where it should go. The Goodbiz Chem team will come back to you with pricing and availability.
        </p>
      </div>

      <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
        <div className="min-w-0 self-start">
          {/* The fallback is the plain form: it is what the server HTML (and a no-JavaScript visitor) gets. */}
          <Suspense fallback={<StepQuoteForm />}>
            <StepQuoteFormFromQuery />
          </Suspense>
        </div>

        <aside aria-labelledby="quote-checklist" className="self-start rounded-lg bg-surface p-6 lg:sticky lg:top-24">
          <h2 id="quote-checklist" className="font-display text-lg font-semibold text-ink">
            What helps us quote
          </h2>
          <ul className="mt-4 grid gap-3 text-[0.9375rem] text-ink-muted">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-5 text-[0.9375rem] text-ink">SDS available on request.</p>
        </aside>
      </div>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
