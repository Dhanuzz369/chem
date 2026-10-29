import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, site } from "@/config/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, verificationMetadata } from "@/lib/seo/metadata";
import { FEED_ALTERNATE } from "@/lib/seo/rss";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

const body = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// A site-wide canonical would point every page at the home page, so drop it here.
const defaults = buildMetadata({ title: site.name, description: site.tagline, path: "/" });
delete defaults.alternates;
// Likewise og:url: pages without their own buildMetadata must not claim the home URL.
if (defaults.openGraph) delete defaults.openGraph.url;

export const metadata: Metadata = {
  ...defaults,
  metadataBase: new URL(getSiteUrl()),
  title: { default: site.name, template: `%s | ${site.name}` },
  applicationName: site.name,
  category: "Chemicals",
  creator: site.name,
  publisher: site.name,
  // Stops iOS turning HSN and CAS numbers into phone links.
  formatDetection: { telephone: false },
  // Search Console and Bing Webmaster ownership tags, read at build time; nothing renders while unset.
  verification: verificationMetadata(),
  // Feed readers and AI crawlers find the blog feed from any page.
  alternates: { types: FEED_ALTERNATE },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {/* The analytics script is served by Vercel; elsewhere (local, CI) it would only 404. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
