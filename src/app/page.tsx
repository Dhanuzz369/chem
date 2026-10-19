import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

// Placeholder home. The real home page arrives in Task 8.
export default function Home() {
  return (
    <Container className="py-20 md:py-28">
      <h1 className="text-[clamp(2.5rem,5vw+1rem,4.5rem)] font-semibold text-ink">Goodbiz Chem</h1>
      <p className="mt-5 max-w-[56ch] text-lg text-ink-muted">
        Solvents, amines, inorganics and surfactants for industrial buyers in India and abroad.
      </p>
      <div className="mt-8">
        <Button href="/quote" size="lg">
          Request a quote
        </Button>
      </div>
    </Container>
  );
}
