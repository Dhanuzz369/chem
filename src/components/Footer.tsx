import Link from "next/link";
import { site } from "@/config/site";
import { Button } from "./Button";
import { ContactDetails } from "./ContactDetails";
import { Container } from "./Container";
import { Logo } from "./Logo";

// One pastel per group, used behind its HSN chapter tag. The HSN chapter is taken from
// the codes in the spec's product table.
const groups = [
  { name: "Solvents", slug: "solvents", chapter: "29", swatch: "bg-accent-sky" },
  { name: "Amines", slug: "amines", chapter: "29", swatch: "bg-accent-lilac" },
  { name: "Inorganics", slug: "inorganics", chapter: "28", swatch: "bg-accent-butter" },
  { name: "Surfactants", slug: "surfactants", chapter: "34", swatch: "bg-accent-mint" },
] as const;

const quickLinks = [
  { href: "/products", label: "All products" },
  { href: "/quote", label: "Request a quote" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="grid gap-12 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:py-20">
        <div className="flex flex-col items-start gap-5">
          <Link href="/" className="-mx-1 rounded-sm px-1 py-1">
            <Logo className="h-9 w-auto" />
          </Link>
          <p className="max-w-[34ch] text-ink-muted">{site.tagline}</p>
          <p className="inline-flex items-center gap-2 rounded-sm border border-line bg-bg px-3 py-1.5 text-sm text-ink">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-brand-600">
              <path d="M4 1.75h5.5L12.5 4.75v9.5h-8.5z M9.25 1.75v3.25h3.25 M6.5 8.5h4 M6.5 11h4" strokeLinejoin="round" />
            </svg>
            SDS available on request
          </p>
          <ContactDetails contact={site.contact} />
          <Button href="/quote" variant="secondary" className="mt-1">
            Request a quote
          </Button>
        </div>

        <div className="grid gap-10 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <nav aria-labelledby="footer-groups">
            <h2 id="footer-groups" className="font-body text-sm font-medium tracking-normal text-ink-muted">
              Product groups
            </h2>
            <ul className="mt-3 border-t border-line">
              {groups.map((group) => (
                <li key={group.slug} className="border-b border-line">
                  <Link
                    href={`/products?group=${group.slug}`}
                    className="group flex h-12 items-center gap-3 text-ink"
                  >
                    <span className="font-medium [@media(hover:hover)]:group-hover:text-brand-700">{group.name}</span>
                    <span className={`ml-auto rounded-sm px-2 py-0.5 font-mono text-xs text-ink tabular-nums ${group.swatch}`}>
                      HSN ch. {group.chapter}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-links">
            <h2 id="footer-links" className="font-body text-sm font-medium tracking-normal text-ink-muted">
              Quick links
            </h2>
            <ul className="mt-3 grid gap-0.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex h-10 items-center text-ink underline-offset-4 [@media(hover:hover)]:hover:text-brand-700 [@media(hover:hover)]:hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="py-5 text-sm text-ink-muted">
          <p>© {site.name}</p>
        </Container>
      </div>
    </footer>
  );
}
