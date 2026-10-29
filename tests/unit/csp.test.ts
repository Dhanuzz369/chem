import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, leadOrigins } from "@/config/csp";

const APPS_SCRIPT = "https://script.google.com/macros/s/abc/exec";

const directive = (policy: string, name: string) => policy.split("; ").find((d) => d.startsWith(`${name} `));

describe("leadOrigins", () => {
  it("allows Apps Script and the host it redirects to", () => {
    expect(leadOrigins(APPS_SCRIPT)).toEqual(["https://script.google.com", "https://script.googleusercontent.com"]);
  });

  it("allows only the origin of any other absolute endpoint", () => {
    expect(leadOrigins("https://leads.example.com/hook?x=1")).toEqual(["https://leads.example.com"]);
  });

  it("adds nothing for a missing, switched-off, relative or non-web endpoint", () => {
    for (const raw of [undefined, "", "  ", "off", "OFF", "/__e2e/leads", "javascript:alert(1)", "data:text/plain,x"]) {
      expect(leadOrigins(raw)).toEqual([]);
    }
  });
});

describe("contentSecurityPolicy", () => {
  it("lets the quote form reach Apps Script by fetch and by plain form post", () => {
    const policy = contentSecurityPolicy({ NEXT_PUBLIC_LEADS_ENDPOINT: APPS_SCRIPT, NODE_ENV: "production" });
    for (const name of ["connect-src", "form-action"]) {
      expect(directive(policy, name)).toBe(`${name} 'self' https://script.google.com https://script.googleusercontent.com`);
    }
  });

  it("keeps everything else on this site and blocks framing and plugins", () => {
    const policy = contentSecurityPolicy({ NODE_ENV: "production" });
    expect(directive(policy, "default-src")).toBe("default-src 'self'");
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(policy, "connect-src")).toBe("connect-src 'self'");
    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(policy, "object-src")).toBe("object-src 'none'");
    expect(policy).toContain("upgrade-insecure-requests");
  });

  it("allows eval only in development, where React needs it", () => {
    const policy = contentSecurityPolicy({ NODE_ENV: "development" });
    expect(directive(policy, "script-src")).toBe("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});
