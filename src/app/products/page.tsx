import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { ProductFinder } from "@/components/ProductFinder";
import { SourcingCallout } from "@/components/SourcingCallout";
import { productGroups } from "@/content/products";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { ProductFinderFromQuery } from "./ProductFinderFromQuery";

export const metadata = buildMetadata({
  title: "Products: solvents, amines, inorganics and surfactants",
  description: `Industrial chemicals in four groups: ${productGroups.join(", ").toLowerCase()}. Search by name, HSN or CAS number and request a quote.`,
  path: "/products",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
];

export default function ProductsPage() {
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[44rem]">
          <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Product catalogue</h1>
          <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
            Solvents, amines, inorganics and surfactants. Find one by name, synonym, HSN code or CAS number, then
            request a quote. SDS available on request.
          </p>
        </div>
        <Button href="/quote" variant="secondary" className="self-start md:self-auto">
          Request a quote
        </Button>
      </div>

      <div className="mt-10 md:mt-14">
        <Suspense fallback={<ProductFinder syncUrl />}>
          <ProductFinderFromQuery />
        </Suspense>
      </div>

      <div className="mt-12 md:mt-16">
        <SourcingCallout />
      </div>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
