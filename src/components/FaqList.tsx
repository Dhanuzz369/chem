import type { Faq } from "@/content/products";

type FaqListProps = {
  faqs: Faq[];
  /** Level of each question heading; the list usually sits under an h2. */
  headingLevel?: 3 | 4;
};

/** Questions as headings inside native disclosures: works without JavaScript and with find-in-page. */
export function FaqList({ faqs, headingLevel = 3 }: FaqListProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="border-t border-line">
      {faqs.map((faq) => (
        <details key={faq.q} className="group border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-3 [&::-webkit-details-marker]:hidden">
            <Heading className="flex-1 font-body text-base font-medium leading-snug tracking-normal text-ink">
              {faq.q}
            </Heading>
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="shrink-0 text-brand-700 transition-transform duration-(--duration-press) ease-(--ease-out) group-open:rotate-45"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </summary>
          <p className="max-w-[65ch] pb-5 pr-8 text-ink-muted">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
