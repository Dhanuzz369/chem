import { describe, expect, it } from "vitest";
import { countryNames } from "@/lib/leads/countries";
import { fallbackLinks, requestSummary } from "@/lib/leads/fallback";
import { emptyAnswers } from "@/lib/leads/steps";
import type { Answers } from "@/lib/leads/steps";

const full: Answers = {
  ...emptyAnswers,
  name: "Asha Rao", company: "Rao Paints", email: "asha@example.com", phone: "+91 98765 43210",
  group: "Solvents", product: "methanol", quantity: "one-container", packaging: ["drums"],
  country: "Germany", port: "Hamburg", terms: "cif", notes: "Need COA & SDS",
};

describe("fallback", () => {
  it("requestSummary writes the request out", () => {
    const text = requestSummary(full);
    for (const part of ["Asha Rao", "Rao Paints", "asha@example.com", "+91 98765 43210", "Methanol",
      "1 container", "Drums", "Germany", "Hamburg", "CIF", "Need COA & SDS"]) {
      expect(text).toContain(part);
    }
    expect(text.split("\n").length).toBeGreaterThan(5);
    expect(requestSummary({ ...emptyAnswers, name: "Asha" })).not.toMatch(/: *$/m);
  });

  it("requestSummary names a chemical that is not listed", () => {
    const text = requestSummary({ ...full, group: "other", product: "methanol", otherProduct: "Glycerine" });
    expect(text).toContain("Glycerine");
    expect(text).not.toContain("Methanol");
  });

  it("requestSummary leaves out a product from another group", () => {
    const text = requestSummary({ ...full, group: "Amines", product: "methanol" });
    expect(text).toContain("Amines");
    expect(text).not.toContain("Methanol");
  });

  it("requestSummary caps long notes", () => {
    const text = requestSummary({ ...full, notes: "y".repeat(1500) });
    expect(text).toContain(`${"y".repeat(1000)}…`);
    expect(text).not.toContain("y".repeat(1001));
  });

  it("the email body uses CRLF line breaks", () => {
    const { email, whatsapp } = fallbackLinks(full);
    const body = email.slice(email.indexOf("&body=") + 6);
    expect(body).toContain("%0D%0A");
    expect(body.replace(/%0D%0A/g, "")).not.toContain("%0A");
    expect(whatsapp).not.toContain("%0D");
  });

  it("fallbackLinks encode the whole request", () => {
    const { whatsapp, email } = fallbackLinks(full);
    expect(whatsapp.startsWith("https://wa.me/918884799369?text=")).toBe(true);
    const waText = decodeURIComponent(whatsapp.slice("https://wa.me/918884799369?text=".length));
    expect(email.startsWith("mailto:chemicals@goodbizglobal.com?subject=")).toBe(true);
    const params = new URLSearchParams(email.slice(email.indexOf("?") + 1));
    const body = params.get("body") ?? "";
    expect(params.get("subject")).toContain("Methanol");
    for (const text of [waText, body]) {
      for (const part of ["Asha Rao", "Methanol", "1 container", "Germany", "CIF"]) {
        expect(text).toContain(part);
      }
    }
    expect(email).not.toContain(" ");
    expect(email).not.toContain("&body=Need");
  });
});

describe("countryNames", () => {
  it("includes common countries without duplicates", () => {
    const names = countryNames();
    expect(names).toContain("India");
    expect(names).toContain("United Arab Emirates");
    expect(names).toContain("Germany");
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(200);
    expect(names).not.toContain("Unknown Region");
    expect(names).toContain("Kosovo");
    for (const gone of ["Antarctica", "Bouvet Island", "Heard & McDonald Islands", "U.S. Outlying Islands"]) {
      expect(names).not.toContain(gone);
    }
    expect([...names].sort((x, y) => x.localeCompare(y, "en"))).toEqual(names);
  });
});
