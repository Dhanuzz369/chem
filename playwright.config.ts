import { defineConfig } from "@playwright/test";

/**
 * Two production builds, because NEXT_PUBLIC_LEADS_ENDPOINT is inlined at build time. Both set it explicitly
 * in the process env, which wins over the committed .env.production, so no test ever posts to the live script:
 * - port 3100: the endpoint points at a stub path on the same server (tests route it with page.route);
 * - port 3101: no endpoint at all (the state before the owner deploys the Apps Script), built into its
 *   own distDir with its own tsconfig (next.config.ts). Only tests tagged @no-endpoint run against it.
 */
const PORT = 3100;
const NO_ENDPOINT_PORT = 3101;
const LEADS_STUB = `http://localhost:${PORT}/__leads`;

const reuseExistingServer = !process.env.CI;
const timeout = 300_000;
const mobile = { viewport: { width: 375, height: 812 } };
const desktop = { viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: [
    {
      command: `npm run build && npm run start -- -p ${PORT}`,
      port: PORT,
      env: { NEXT_PUBLIC_LEADS_ENDPOINT: LEADS_STUB },
      reuseExistingServer,
      timeout,
    },
    {
      command: `npm run build && npm run start -- -p ${NO_ENDPOINT_PORT}`,
      port: NO_ENDPOINT_PORT,
      env: { NEXT_PUBLIC_LEADS_ENDPOINT: "", E2E_NO_ENDPOINT_BUILD: "1" },
      reuseExistingServer,
      timeout,
    },
  ],
  projects: [
    { name: "mobile", grepInvert: /@no-endpoint/, use: mobile },
    { name: "desktop", grepInvert: /@no-endpoint/, use: desktop },
    {
      name: "mobile-no-endpoint",
      grep: /@no-endpoint/,
      use: { ...mobile, baseURL: `http://localhost:${NO_ENDPOINT_PORT}` },
    },
    {
      name: "desktop-no-endpoint",
      grep: /@no-endpoint/,
      use: { ...desktop, baseURL: `http://localhost:${NO_ENDPOINT_PORT}` },
    },
  ],
});
