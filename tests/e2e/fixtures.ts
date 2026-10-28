import { test as base, type BrowserContext } from "@playwright/test";

export { expect } from "@playwright/test";
export type { Locator, Page } from "@playwright/test";

/** The live leads web app (Google Apps Script). No test may ever reach it. */
export const LIVE_SCRIPT = "https://script.google.com/**";

export async function blockLiveScript(context: BrowserContext) {
  await context.route(LIVE_SCRIPT, (route) => route.abort("blockedbyclient"));
}

/**
 * Every e2e spec imports `test` from here, not from @playwright/test (tests/unit/e2e-guard.test.ts
 * checks this): each test's browser context aborts any request to the live script, whatever the
 * build's NEXT_PUBLIC_LEADS_ENDPOINT says.
 */
export const test = base.extend({
  // Named `provide`, not `use`, so the React hooks lint rule does not mistake it for a hook.
  context: async ({ context }, provide) => {
    await blockLiveScript(context);
    await provide(context);
  },
});
