import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: "Industrial and specialty chemicals listed by HSN code. Request a quote; SDS available on request.",
    start_url: "/",
    display: "browser",
    // brand-700 and the white page, from src/app/globals.css.
    theme_color: "#176140",
    background_color: "#ffffff",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
