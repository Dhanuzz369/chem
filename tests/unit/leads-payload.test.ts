import { describe, expect, it } from "vitest";
import { buildPayload } from "@/lib/leads/payload";
import { emptyAnswers } from "@/lib/leads/steps";
import type { Answers } from "@/lib/leads/steps";

const KEYS = [
  "name", "company", "email", "phone", "group", "product", "otherProduct",
  "quantity", "quantityOther", "packaging", "country", "port", "terms", "notes",
  "sourcePage", "userAgent",
];
const meta = { sourcePage: "/quote", userAgent: "test-agent" };
const a = (over: Partial<Answers>): Answers => ({ ...emptyAnswers, ...over });

describe("buildPayload", () => {
  it("payload carries every key and the same leadId", () => {
    const first = buildPayload("lead-1234", "contact", a({ name: "Asha", email: "a@b.co" }), new Set(), meta);
    expect(Object.keys(first).sort()).toEqual([...KEYS, "leadId", "stage"].sort());
    expect(first.leadId).toBe("lead-1234");
    expect(first.stage).toBe("contact");
    expect(first.name).toBe("Asha");
    expect(first.company).toBe("");
    expect(first.product).toBe("");
    expect(first.sourcePage).toBe("/quote");
    expect(first.userAgent).toBe("test-agent");

    const later = buildPayload(
      "lead-1234", "quantity",
      a({ name: "Asha", email: "a@b.co", group: "Solvents", product: "methanol", quantity: "one-container" }),
      new Set(["name", "email", "group", "product"]), meta,
    );
    expect(later.leadId).toBe("lead-1234");
    expect(later.stage).toBe("quantity");
    expect(later.name).toBe("Asha");
    expect(later.group).toBe("Solvents");
    expect(later.product).toBe("Methanol");
    expect(later.quantity).toBe("1 container");
  });

  it("payload clears answers that no longer apply", () => {
    const sent = new Set(["name", "email", "group", "product", "quantity"]);
    const p = buildPayload(
      "lead-1234", "product",
      a({ name: "Asha", email: "a@b.co", group: "other", product: "methanol", otherProduct: "Glycerine",
          quantity: "trial", packaging: ["drums", "ibc"] }),
      sent, meta,
    );
    expect(p.group).toBe("__clear__");
    expect(p.product).toBe("__clear__");
    expect(p.otherProduct).toBe("Glycerine");
    expect(p.packaging).toBe("Drums, IBC tanks");

    // A cleared field never sent before stays empty, not cleared.
    expect(p.notes).toBe("");

    // Another amount replaces the preset; switching back drops the text.
    const other = buildPayload("lead-1234", "quantity", a({ quantity: "other", quantityOther: "40 MT" }),
      new Set(["quantity"]), meta);
    expect(other.quantity).toBe("Another amount");
    expect(other.quantityOther).toBe("40 MT");
    const back = buildPayload("lead-1234", "quantity", a({ quantity: "trial", quantityOther: "40 MT" }),
      new Set(["quantity", "quantityOther"]), meta);
    expect(back.quantityOther).toBe("__clear__");

    // Choosing a real group again clears the free text.
    const regroup = buildPayload("lead-1234", "product", a({ group: "Amines", otherProduct: "Glycerine" }),
      new Set(["otherProduct"]), meta);
    expect(regroup.otherProduct).toBe("__clear__");
    expect(regroup.group).toBe("Amines");
  });

  it("any product and terms use human labels", () => {
    const p = buildPayload("lead-1234", "terms", a({ group: "Amines", product: "any", terms: "cif" }), new Set(), meta);
    expect(p.product).toBe("Any / not sure");
    expect(p.terms).toBe("CIF");
  });
});
