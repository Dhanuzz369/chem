import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard, groupSwatch } from "@/components/ProductCard";
import { QuoteForm } from "@/components/QuoteForm";
import { getProduct, products, type Product } from "@/content/products";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { StickyQuoteBar } from "./StickyQuoteBar";

// `dynamicParams = false` is not allowed with cacheComponents; unknown slugs call notFound() instead.
// 'navigation' makes the first request for an unlisted slug wait for the full render, so it gets a
// real 404 status instead of a 200 App Shell that later streams the not-found page.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

function firstSentence(text: string) {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return buildMetadata({
    title: `${product.name} (HSN ${product.hsn}) Exporter`,
    description: `${firstSentence(product.summary)} HSN ${product.hsn}, CAS ${product.cas.join(", ")}. SDS available on request. Request a quote from Goodbiz Chem.`,
    path: `/products/${product.slug}`,
  });
}

const QUOTE_ID = "quote";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line py-10 md:py-12">
      <h2 id={id} className="text-2xl font-semibold text-ink md:text-[1.75rem]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid max-w-[65ch] gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SdsNote() {
  return (
    <p className="inline-flex items-center gap-2 rounded-sm border border-line bg-bg px-3 py-1.5 text-sm text-ink">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 text-brand-600">
        <path d="M4 1.75h5.5L12.5 4.75v9.5h-8.5z M9.25 1.75v3.25h3.25 M6.5 8.5h4 M6.5 11h4" strokeLinejoin="round" />
      </svg>
      SDS available on request
    </p>
  );
}

function KeyFacts({ product }: { product: Product }) {
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "HSN code",
      value: (
        <span className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[0.9375rem] tabular-nums ${groupSwatch[product.group]}`}>
          {product.hsn}
        </span>
      ),
    },
    {
      label: product.cas.length > 1 ? "CAS numbers" : "CAS number",
      value: (
        <span className="flex flex-wrap gap-x-3 font-mono text-[0.9375rem] tabular-nums">
          {product.cas.map((cas) => (
            <span key={cas}>{cas}</span>
          ))}
        </span>
      ),
    },
    { label: "Group", value: product.group },
    { label: "Form", value: product.form },
  ];
  return (
    <section aria-labelledby="key-facts" className="rounded-lg border border-line bg-surface p-5 md:p-6">
      <h2 id="key-facts" className="font-body text-sm font-medium tracking-normal text-ink-muted">
        Key facts
      </h2>
      <dl className="mt-3 divide-y divide-line border-t border-line">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-3 lg:grid-cols-1 lg:gap-1">
            <dt className="text-sm text-ink-muted">{row.label}</dt>
            <dd className="text-[0.9375rem] text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 hidden flex-col gap-4 lg:flex">
        <Button href={`#${QUOTE_ID}`} className="w-full">
          Request a quote
        </Button>
        <SdsNote />
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();

  const related = product.related.map(getProduct).filter((p): p is Product => Boolean(p));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <>
      <Container className="pt-8 pb-16 md:pt-12 md:pb-20">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <header className="pb-8 lg:col-start-1 lg:pb-10">
            <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">{product.name}</h1>
            <p className="mt-4 max-w-[62ch] text-lg text-ink">{product.summary}</p>
            {product.synonyms.length > 0 && (
              <p className="mt-4 max-w-[62ch] text-[0.9375rem] text-ink-muted">
                <span className="font-medium text-ink">Also known as:</span> {product.synonyms.join(", ")}
              </p>
            )}
          </header>

          <div className="pb-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pb-0">
            <div className="lg:sticky lg:top-28">
              <KeyFacts product={product} />
            </div>
          </div>

          <div className="lg:col-start-1">
            <Section id="uses" title={`Where is ${product.name} used?`}>
              <Bullets items={product.applications} />
              <h3 className="mt-8 font-body text-base font-medium tracking-normal text-ink">Industries</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.industries.map((industry) => (
                  <li key={industry} className="rounded-sm bg-brand-50 px-2.5 py-1 text-sm text-ink">
                    {industry}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="packaging" title="Packaging">
              <Bullets items={product.packaging} />
              <p className="mt-5 max-w-[65ch] text-[0.9375rem] text-ink-muted">
                Tell us the packaging you prefer when you request a quote.
              </p>
            </Section>

            <Section id="handling" title="Handling, storage and hazards">
              <h3 className="font-body text-base font-medium tracking-normal text-ink">Handling and storage</h3>
              <div className="mt-3">
                <Bullets items={product.handling} />
              </div>
              <div className="mt-8 rounded-lg border border-line bg-surface p-5 md:p-6">
                <h3 className="font-body text-base font-medium tracking-normal text-ink">Hazards</h3>
                <ul className="mt-3 grid max-w-[65ch] gap-2.5">
                  {product.hazards.map((hazard) => (
                    <li key={hazard} className="flex gap-3 text-ink">
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="mt-1 shrink-0 text-ink-muted">
                        <path d="M8 2 14.5 13.5h-13z M8 6.5v3.25 M8 11.5v.25" />
                      </svg>
                      <span>{hazard}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-ink-muted">
                  General hazard information, not a substitute for the safety data sheet.
                </p>
              </div>
              <div className="mt-5">
                <SdsNote />
              </div>
            </Section>

            {product.notes && product.notes.length > 0 && (
              <Section id="notes" title="Notes for buyers">
                <div className="grid max-w-[65ch] gap-3">
                  {product.notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </Section>
            )}

            <Section id="faq" title={`Questions about ${product.name}`}>
              <FaqList faqs={product.faqs} />
            </Section>

            {related.length > 0 && (
              <Section id="related" title="Related products">
                <ul className="border-t border-line">
                  {related.map((p) => (
                    <li key={p.slug} className="border-b border-line">
                      <ProductCard product={p} headingLevel={3} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <section id={QUOTE_ID} aria-labelledby="quote-title" className="scroll-mt-24 border-t border-line pt-10 md:pt-12">
              <h2 id="quote-title" className="text-2xl font-semibold text-ink md:text-[1.75rem]">
                Request a quote for {product.name}
              </h2>
              <p className="mt-3 max-w-[60ch] text-ink-muted">
                {product.name} is already selected. Add quantity, packaging and destination, and the Goodbiz Chem team will
                come back to you with pricing and availability.
              </p>
              <div className="mt-8 max-w-[40rem]">
                <QuoteForm compact defaultProducts={[product.slug]} />
              </div>
            </section>
          </div>
        </div>
      </Container>

      <StickyQuoteBar name={product.name} hsn={product.hsn} targetId={QUOTE_ID} />
      <JsonLd data={[productJsonLd(product), faqJsonLd(product.faqs), breadcrumbJsonLd(crumbs)]} />
    </>
  );
}
