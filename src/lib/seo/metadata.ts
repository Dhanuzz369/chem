import type { Metadata } from "next";
import { absoluteUrl, isIndexingAllowed, site } from "@/config/site";

export const DEFAULT_OG_IMAGE = "/og-default.png";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

/** Page metadata with canonical, Open Graph, Twitter and robots derived from env at call time. */
export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);
  const index = isIndexingAllowed();
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index, follow: index },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type,
      locale: "en",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}
