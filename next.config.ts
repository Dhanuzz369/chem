import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { assertSiteUrlForIndexing, missingContactWarning } from "./src/config/build-checks";
import { site } from "./src/config/site";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// The e2e suite builds a second copy without NEXT_PUBLIC_LEADS_ENDPOINT (playwright.config.ts). It gets its own
// folder and its own tsconfig, so neither build type-checks the other's generated route types.
const e2eNoEndpoint = process.env.E2E_NO_ENDPOINT_BUILD === "1";

const nextConfig: NextConfig = {
  ...(e2eNoEndpoint && { distDir: ".next-e2e-no-endpoint", typescript: { tsconfigPath: "tsconfig.e2e.json" } }),
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertSiteUrlForIndexing(process.env);
    const warning = missingContactWarning(process.env, site.contact);
    // Next loads this config more than once per build; say it once.
    const shown = globalThis as { __goodbizContactWarned?: boolean };
    if (warning && !shown.__goodbizContactWarned) {
      shown.__goodbizContactWarned = true;
      console.warn(warning);
    }
  }
  return nextConfig;
}
