import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { FaqList } from "@/components/FaqList";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { PostList } from "@/components/PostList";
import { ProductFinder } from "@/components/ProductFinder";
import { site } from "@/config/site";
import { products, type Faq } from "@/content/products";
import { getAllPosts } from "@/lib/blog";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: `${site.name}: solvents, amines, inorganics and surfactants`,
  description: `${site.tagline} ${products.length} chemicals listed by HSN and CAS number. Request a quote; SDS available on request.`,
  path: "/",
});

const steps: { title: string; body: string }[] = [
  {
    title: "Enquiry",
    body: "Send the quote form with the products, quantity, packaging and destination. Grade or specification details help.",
  },
  {
    title: "Quote",
    body: "We reply with a quote for your order. Price, packaging, terms and timing are set out there and depend on the order.",
  },
  {
    title: "Documentation",
    body: "An SDS is available on request for every product. Other documents you need, such as a COA, are agreed in the quote.",
  },
  {
    title: "Dispatch",
    body: "Once the order is confirmed, the goods are packed as agreed and shipped with the documents for your destination.",
  },
];

const faqs: Faq[] = [
  {
    q: "How do I request a quote?",
    a: "Use the quote form. Choose one or more products, give the quantity and unit, and tell us the destination and any packaging or documents you need. We reply to the email address you give.",
  },
  {
    q: "What does a quote include?",
    a: "The products and quantities you asked for, the price, the packaging and the delivery terms for your destination. Anything that varies by order, such as minimum quantities or timing, is confirmed in your quote.",
  },
  {
    q: "Which documents can I get?",
    a: "An SDS (safety data sheet) is available on request for every product. You can also ask for a certificate of analysis (COA) and the shipping documents your import needs; what comes with your order is confirmed in your quote.",
  },
  {
    q: "What packaging options are there?",
    a: "Packaging depends on the product and its form, liquid or solid. Tell us what suits you, for example drums, IBCs or bags, and the options available for your order are confirmed in your quote.",
  },
  {
    q: "Why does every product show an HSN code?",
    a: "HSN codes classify goods for customs and tax. They follow the Harmonized System used in international trade. Each product lists the code it is traded under, so your team can check the classification before ordering.",
  },
  {
    q: "Can I ask for a product that is not listed?",
    a: "Yes. Mention it in the “Anything else” field of the quote form, with the name, CAS number or specification, and we will tell you whether we can quote for it.",
  },
];

function Section({ id, title, intro, children, className = "" }: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`py-14 md:py-20 ${className}`}>
      <Container>
        <h2 id={`${id}-title`} className="text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)] font-semibold text-ink">
          {title}
        </h2>
        {intro && <div className="mt-4 max-w-[60ch] text-lg text-ink-muted">{intro}</div>}
        <div className="mt-8 md:mt-10">{children}</div>
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <section aria-labelledby="about-title" className="py-14 md:py-20">
        <Container className="grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-12">
          <h2 id="about-title" className="text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)] font-semibold text-ink">
            Who we are
          </h2>
          <div className="max-w-[62ch] space-y-4 text-lg text-ink">
            <p>
              {site.name} is a supplier of industrial and specialty chemicals. We work with procurement and technical
              teams at manufacturers, and we handle each order from first enquiry to dispatch.
            </p>
            <p className="text-ink-muted">
              The range covers four groups: solvents, amines, inorganics and surfactants. Every product
              is listed with its HSN code and CAS number, so you can check that it is the material you need before you
              ask for a price.
            </p>
          </div>
        </Container>
      </section>

      <Section
        id="product-range"
        title="Product range"
        className="border-t border-line"
        intro={
          <p>
            Filter by group or search by name, synonym, HSN code or CAS number. Each row opens the product page with
            its specification summary and handling notes.
          </p>
        }
      >
        <ProductFinder headingLevel={3} />
      </Section>

      <Section
        id="ordering"
        title="How ordering and export work"
        className="bg-surface"
        intro={<p>Every order follows the same four steps. Anything specific to your order is set out in the quote.</p>}
      >
        <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t-2 border-brand-600 pt-4">
              <p aria-hidden="true" className="font-mono text-sm text-brand-700 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="faq" title="Frequently asked questions">
        <div className="max-w-[52rem]">
          <FaqList faqs={faqs} />
        </div>
      </Section>

      <Section
        id="latest-posts"
        title="Latest from the blog"
        className="border-t border-line"
        intro={<p>Plain answers on trade codes, grades and choosing materials.</p>}
      >
        <PostList posts={getAllPosts().slice(0, 3)} label="Latest posts" headingLevel={3} />
        <div className="mt-8">
          <Button href="/blog" variant="ghost" className="-ml-4">
            All posts
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </Section>

      <section aria-labelledby="closing-title" className="pb-16 md:pb-24">
        <Container>
          <div className="grid gap-6 rounded-lg bg-brand-100 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-10">
            <div>
              <h2 id="closing-title" className="text-[clamp(1.75rem,1.5vw+1.25rem,2.5rem)] font-semibold text-ink">
                Ask for a quote
              </h2>
              <p className="mt-3 max-w-[56ch] text-ink">
                Tell us the products, quantities, packaging and destination. One form covers a single product or
                several.
              </p>
            </div>
            <Button href="/quote" size="lg" className="justify-self-start">
              Request a quote
            </Button>
          </div>
        </Container>
      </section>

      <JsonLd data={faqJsonLd(faqs)} />
    </>
  );
}
