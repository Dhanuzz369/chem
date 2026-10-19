import { Button } from "./Button";

/** Shared wording: Goodbiz Chem also sources chemicals that are not in the catalogue (the owner's own statement). */
export const sourcingLine = "Tell us what you need and we'll source and supply it.";

/** Slim panel after the catalogue: the way forward when a chemical isn't listed. */
export function SourcingCallout({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      aria-labelledby="sourcing-title"
      className="grid gap-5 rounded-lg border border-brand-200 bg-brand-50 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:p-6"
    >
      <div>
        <Heading id="sourcing-title" className="text-xl font-semibold text-ink md:text-[1.375rem]">
          Need a chemical that isn&apos;t listed?
        </Heading>
        <p className="mt-2 max-w-[60ch] text-ink-muted">
          {sourcingLine} Give the name, grade, CAS number or specification on the quote form.
        </p>
      </div>
      <Button href="/quote#other" className="justify-self-start">
        Request a chemical not listed
      </Button>
    </section>
  );
}
