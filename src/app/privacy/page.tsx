import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/config/site";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { CONSENT_KEY } from "@/lib/consent";
import { CONSENT_REGIONS } from "@/lib/consent-regions";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Privacy and Cookie Policy",
  description:
    "How Goodbiz Chem handles quote requests and Google Analytics cookies: no advertising, consent first in Europe and other listed countries, an opt-out everywhere.",
  path: "/privacy",
});

/** Change this when the policy text changes. */
const UPDATED = "10 November 2026";

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy and cookies", path: "/privacy" },
];

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const askFirstCountries = CONSENT_REGIONS.map((code) => regionNames.of(code) ?? code).sort((a, b) => a.localeCompare(b));
const gaCookie = `_ga_${GA_MEASUREMENT_ID.slice(2)}`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="font-display text-2xl font-semibold text-ink">
        {title}
      </h2>
      <div className="mt-3 grid gap-3 text-ink-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <Container className="py-10 md:py-16">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 max-w-[44rem]">
        <h1 className="text-[clamp(2.25rem,3vw+1.25rem,3.5rem)] font-semibold text-ink">Privacy and cookie policy</h1>
        <p className="mt-4 text-sm text-ink-muted">Last updated {UPDATED}</p>
        <p className="mt-4 text-lg text-ink-muted">
          {site.name}, {site.contact.address}, runs this site. This page says what we collect, why, and how to switch
          analytics off. Questions or requests: <a className="font-medium text-brand-700 underline underline-offset-4" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>.
        </p>

        <Section id="quotes" title="Quote requests">
          <p>
            When you use the quote form, we receive what you type: your name, company, email or WhatsApp number, and the
            product, quantity and shipping details. It is saved to our Google Sheet, emailed to our sales team, and
            used only to answer your enquiry and handle any order. We do not sell it or use it for advertising. Ask us
            at any time to see, correct or delete it.
          </p>
        </Section>

        <Section id="analytics" title="Google Analytics">
          <p>
            We use Google Analytics to see which pages and products buyers look at, so we can improve the site. It is
            set up for analytics only: no advertising, no Google signals and no ad personalisation, and nothing about
            you is sold. Google processes this data for us as our processor.
          </p>
          <p>
            <strong className="font-medium text-ink">Where we ask first.</strong> In Europe (the EU, the EEA, the UK and
            Switzerland) and in countries where Arabic, French, Spanish, Portuguese, Russian, Chinese, German, Turkish,
            Indonesian, Swahili or Vietnamese is spoken, nothing loads from Google until you click Accept. Our legal
            basis there is your consent.
          </p>
          <p>
            <strong className="font-medium text-ink">Everywhere else</strong>, for example India and the USA, analytics
            runs by default. Our legal basis there is our interest in knowing how the site is used, with this notice and
            an opt-out: open <CookieSettingsButton className="cursor-pointer font-medium text-brand-700 underline underline-offset-4" /> and
            choose Reject. That stops Analytics and deletes its cookies.
          </p>
          <details className="rounded-lg bg-surface p-4">
            <summary className="cursor-pointer font-medium text-ink">Countries where we ask first ({askFirstCountries.length})</summary>
            <p className="mt-3 text-sm">{askFirstCountries.join(", ")}.</p>
          </details>
        </Section>

        <Section id="cookies" title="Cookies and storage we use">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Purpose</th>
                  <th scope="col" className="py-2 font-medium">Kept for</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2 pr-4 font-mono">_ga</td>
                  <td className="py-2 pr-4">Google Analytics: tells visits from the same browser apart</td>
                  <td className="py-2">Up to 2 years</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2 pr-4 font-mono">{gaCookie}</td>
                  <td className="py-2 pr-4">Google Analytics: keeps the current session</td>
                  <td className="py-2">Up to 2 years</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2 pr-4 font-mono">{CONSENT_KEY}</td>
                  <td className="py-2 pr-4">Your Accept or Reject choice (stored in your browser, not a cookie)</td>
                  <td className="py-2">12 months, then we ask again</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            We also use Vercel Web Analytics, which counts page views without cookies and without identifying you.
          </p>
        </Section>
      </div>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </Container>
  );
}
