import { describe, expect, it } from "vitest";
import { emptyAnswers, stageFor, validateStep, visibleSteps } from "@/lib/leads/steps";
import type { Answers, StepId } from "@/lib/leads/steps";

const a = (over: Partial<Answers>): Answers => ({ ...emptyAnswers, ...over });

describe("validateStep", () => {
  it("contact step accepts email or 7+ digit phone", () => {
    expect(validateStep("contact", a({ name: "Asha", email: "a@b.co" }))).toEqual({});
    expect(validateStep("contact", a({ name: "Asha", phone: "+91 98765-43210" }))).toEqual({});

    expect(validateStep("contact", a({ email: "a@b.co" }))).toHaveProperty("name");
    const short = validateStep("contact", a({ name: "Asha", phone: "12345" }));
    expect(short).toHaveProperty("email");
    expect(Object.keys(validateStep("contact", a({ name: "Asha", phone: "abcdefg" }))).length).toBeGreaterThan(0);
    expect(validateStep("contact", a({ name: "   ", email: "a@b.co" }))).toHaveProperty("name");
    expect(validateStep("contact", a({ name: "Asha", email: "not-an-email" }))).toHaveProperty("email");
  });

  it("group step requires a group or something else with text", () => {
    expect(validateStep("group", a({}))).toHaveProperty("group");
    expect(validateStep("group", a({ group: "Solvents" }))).toEqual({});
    expect(validateStep("group", a({ group: "other" }))).toHaveProperty("otherProduct");
    expect(validateStep("group", a({ group: "other", otherProduct: "  " }))).toHaveProperty("otherProduct");
    expect(validateStep("group", a({ group: "other", otherProduct: "Glycerine" }))).toEqual({});
  });

  it("product step accepts any", () => {
    expect(validateStep("product", a({ group: "Solvents" }))).toHaveProperty("product");
    expect(validateStep("product", a({ group: "Solvents", product: "any" }))).toEqual({});
    expect(validateStep("product", a({ group: "Solvents", product: "methanol" }))).toEqual({});
    expect(validateStep("product", a({ group: "Solvents", product: "labsa" }))).toHaveProperty("product");
  });

  it("quantity other needs text", () => {
    expect(validateStep("quantity", a({}))).toHaveProperty("quantity");
    expect(validateStep("quantity", a({ quantity: "trial" }))).toEqual({});
    expect(validateStep("quantity", a({ quantity: "not-sure" }))).toEqual({});
    expect(validateStep("quantity", a({ quantity: "other" }))).toHaveProperty("quantityOther");
    expect(validateStep("quantity", a({ quantity: "other", quantityOther: "40 MT" }))).toEqual({});
  });

  it("destination needs country", () => {
    expect(validateStep("destination", a({ port: "Hamburg" }))).toHaveProperty("country");
    expect(validateStep("destination", a({ country: "Germany" }))).toEqual({});
  });

  it("terms needs a choice", () => {
    expect(validateStep("terms", a({}))).toHaveProperty("terms");
    expect(validateStep("terms", a({ terms: "not-sure" }))).toEqual({});
  });

  it("notes always valid", () => {
    expect(validateStep("notes", a({}))).toEqual({});
  });
});

describe("visibleSteps", () => {
  it("visibleSteps skips product for something else and honours skip", () => {
    expect(visibleSteps(a({}), new Set())).toEqual([
      "contact", "group", "product", "quantity", "destination", "terms", "notes",
    ]);
    expect(visibleSteps(a({ group: "other" }), new Set())).not.toContain("product");
    expect(visibleSteps(a({ group: "Solvents" }), new Set<StepId>(["group", "product"]))).toEqual([
      "contact", "quantity", "destination", "terms", "notes",
    ]);
  });
});

describe("stageFor", () => {
  it("maps steps to sheet stages", () => {
    expect(stageFor("contact")).toBe("contact");
    expect(stageFor("group")).toBe("product");
    expect(stageFor("product")).toBe("product");
    expect(stageFor("quantity")).toBe("quantity");
    expect(stageFor("destination")).toBe("destination");
    expect(stageFor("terms")).toBe("terms");
    expect(stageFor("notes")).toBe("submitted");
  });
});
