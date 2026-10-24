import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { productGroups } from "@/content/products";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { site } from "@/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: `About Us: Chemical Exporter from ${site.origin.country}`,
  description: `What Goodbiz Chem, a chemical exporter and supplier from ${site.origin.country}, supplies and how we work with buyers from enquiry to dispatch.`,
  path: "/about",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

const groupSwatch: Record<string, string> = {
  Solvents: "bg-accent-sky",
  Amines: "bg-accent-lilac",
  Inorganics: "bg-accent-butter",
  Surfactants: "bg-accent-mint",
};

const steps = [
  { title: "Enquiry", text: "You tell us the product, quantity, packaging and destination through the quote form." },
  { title: "Quote", text: "Your quote confirms price and availability." },
  { title: "Documents", text: "We prepare the shipping documents the order needs, and you can ask for an SDS or COA." },
  { title: "Dispatch", text: "Once the order is confirmed, we arrange dispatch to the destination you named." },
];

export default function AboutPage() {
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 max-w-[44rem]">
        <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">About Goodbiz Chem</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
          Goodbiz Chem supplies industrial and specialty chemicals to manufacturers. This site lists the range by name and
          HSN code so a buyer can confirm a product quickly and ask for a quote.
        </p>
      </div>

      <section aria-labelledby="supply" className="mt-14 md:mt-20">
        <h2 id="supply" className="font-display text-2xl font-semibold text-ink">
          What we supply
        </h2>
        <p className="mt-3 max-w-[58ch] text-ink-muted">
          Industrial chemicals in four groups: solvents, amines, inorganics and surfactants. Each product page gives its
          HSN code, general applications and handling notes. If you need a chemical that isn&apos;t listed, tell us
          what you need and we&apos;ll source and supply it.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {productGroups.map((group) => (
            <li key={group}>
              <Link
                href={`/products?group=${group.toLowerCase()}`}
                className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border border-transparent p-5 transition-[transform,border-color] duration-(--duration-press) ease-(--ease-out) active:scale-[0.98] [@media(hover:hover)]:hover:border-brand-300 ${groupSwatch[group]}`}
              >
                <h3 className="font-display text-lg font-semibold text-ink">{group}</h3>
                <span aria-hidden="true" className="text-ink-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Button href="/products" variant="secondary" className="mt-6">
          Browse the catalogue
        </Button>
      </section>

      <section aria-labelledby="how" className="mt-14 md:mt-20">
        <h2 id="how" className="font-display text-2xl font-semibold text-ink">
          How we work with buyers
        </h2>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="bg-bg p-5">
              <span className="font-mono text-sm text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="documents" className="mt-14 rounded-lg bg-surface p-6 md:mt-20 md:p-8">
        <h2 id="documents" className="font-display text-2xl font-semibold text-ink">
          What you can ask for
        </h2>
        <p className="mt-3 max-w-[58ch] text-ink-muted">
          You can ask for a Safety Data Sheet (SDS) or a Certificate of Analysis (COA) with your quote request. SDS
          available on request.
        </p>
        <Button href="/quote" className="mt-6">
          Request a quote
        </Button>
      </section>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
