import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(process.cwd(), "tests/e2e");
const specs = readdirSync(dir).filter((f) => f.endsWith(".spec.ts"));

describe("e2e guard against the live leads script", () => {
  it("every spec takes `test` from tests/e2e/fixtures.ts, which blocks https://script.google.com/**", () => {
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) {
      const code = readFileSync(join(dir, spec), "utf8");
      expect(code, spec).not.toMatch(/from "@playwright\/test"/);
      expect(code, spec).toMatch(/from "\.\/fixtures"/);
      // A hand-made context would skip the guard; use test.use({...}) options instead.
      expect(code, spec).not.toMatch(/\.newContext\(/);
    }
  });

  it("the Playwright config never reuses a server it did not build", () => {
    const config = readFileSync(join(process.cwd(), "playwright.config.ts"), "utf8");
    expect(config).toMatch(/reuseExistingServer = false/);
    expect(config).not.toMatch(/reuseExistingServer = !process\.env\.CI/);
  });
});
