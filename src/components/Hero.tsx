import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { HeroScene } from "@/components/HeroScene";
import { productGroups } from "@/content/products";

/** Inventory header: what is listed and how to ask for it. The molecule is a quiet opener beside it. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <Container className="grid items-center gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14 lg:py-20">
        <div>
          <h1
            id="hero-title"
            className="max-w-[18ch] text-[clamp(2.5rem,5vw+1rem,4.5rem)] font-semibold text-ink"
          >
            Industrial chemicals, listed by HSN code
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-ink-muted">
            Goodbiz Chem supplies solvents, amines, inorganics and surfactants to manufacturers. Find a product by name,
            HSN or CAS number, then request a quote. SDS available on request.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/quote" size="lg">
              Request a quote
            </Button>
            <Button href="#product-range" size="lg" variant="secondary">
              Browse the catalogue
            </Button>
          </div>
          <ul
            aria-label="Product groups"
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-[0.9375rem]"
          >
            {productGroups.map((group) => (
              <li key={group} className="text-ink-muted">
                {group}
              </li>
            ))}
          </ul>
        </div>
        <HeroScene />
      </Container>
    </section>
  );
}
