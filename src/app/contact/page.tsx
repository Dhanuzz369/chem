import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContactDetails, contactRows } from "@/components/ContactDetails";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { QuoteForm } from "@/components/QuoteForm";
import { site } from "@/config/site";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact Goodbiz Chem. The fastest route is the quote form: tell us the product, quantity and destination.",
  path: "/contact",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
];

export default function ContactPage() {
  const hasDetails = contactRows(site.contact).length > 0;
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 max-w-[44rem]">
        <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Contact</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-ink-muted">
          {hasDetails
            ? "Write to us with the form, or use the details below."
            : "The fastest route is the quote form below. Tell us the product, quantity and destination."}
        </p>
      </div>

      <div className={`mt-10 grid gap-12 md:mt-14 lg:gap-16 ${hasDetails ? "lg:grid-cols-[minmax(0,1fr)_18rem]" : ""}`}>
        <QuoteForm />
        {hasDetails && (
          <aside aria-labelledby="contact-details" className="self-start rounded-lg bg-surface p-6 lg:sticky lg:top-24">
            <h2 id="contact-details" className="font-display text-lg font-semibold text-ink">
              Contact details
            </h2>
            <ContactDetails contact={site.contact} className="mt-4 gap-3 text-[0.9375rem]" />
          </aside>
        )}
      </div>

      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
