import type { ProductGroup } from "@/content/products";
import { productOptions } from "./options";
import type { PackagingId, QuantityId, TermsId } from "./options";
import { strings } from "./strings";

export type StepId = "contact" | "group" | "product" | "quantity" | "destination" | "terms" | "notes";
export type Stage = "contact" | "product" | "quantity" | "destination" | "terms" | "submitted";

export type Answers = {
  name: string;
  company: string;
  email: string;
  phone: string;
  group: ProductGroup | "other" | "";
  /** A product slug, "any" or "". */
  product: string;
  otherProduct: string;
  quantity: QuantityId | "";
  quantityOther: string;
  packaging: PackagingId[];
  country: string;
  port: string;
  terms: TermsId | "";
  notes: string;
};

export const emptyAnswers: Answers = {
  name: "", company: "", email: "", phone: "",
  group: "", product: "", otherProduct: "",
  quantity: "", quantityOther: "", packaging: [],
  country: "", port: "", terms: "", notes: "",
};

const allSteps: StepId[] = ["contact", "group", "product", "quantity", "destination", "terms", "notes"];

/** The steps the buyer sees: "Something else" skips the product step; pre-filled steps are skipped. */
export function visibleSteps(a: Answers, skip: ReadonlySet<StepId>): StepId[] {
  return allSteps.filter((s) => !skip.has(s) && !(s === "product" && a.group === "other"));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[+\d\s().-]+$/;

export function isValidEmail(v: string): boolean {
  return EMAIL.test(v.trim());
}

/** Seven or more digits; spaces, dashes, dots, brackets and a leading + are allowed, letters are not. */
export function isValidPhone(v: string): boolean {
  const s = v.trim();
  return PHONE_CHARS.test(s) && s.replace(/\D/g, "").length >= 7;
}

type Errors = Partial<Record<keyof Answers, string>>;

/** Errors for one step, keyed by the field they sit under; {} when the step is valid. */
export function validateStep(step: StepId, a: Answers): Errors {
  const e: Errors = {};
  const blank = (v: string) => v.trim() === "";
  switch (step) {
    case "contact": {
      if (blank(a.name)) e.name = strings.errors.name;
      if (!isValidEmail(a.email) && !isValidPhone(a.phone)) {
        // One slot for the pair: the hint "Email or WhatsApp is enough." sits under email.
        e.email = !blank(a.email)
          ? strings.errors.emailInvalid
          : !blank(a.phone)
            ? strings.errors.phoneInvalid
            : strings.errors.contactMissing;
      }
      break;
    }
    case "group":
      if (a.group === "") e.group = strings.errors.group;
      else if (a.group === "other" && blank(a.otherProduct)) e.otherProduct = strings.errors.otherProduct;
      break;
    case "product": {
      const ok =
        a.product === "any" ||
        (a.group !== "" && a.group !== "other" && productOptions(a.group).some((o) => o.id === a.product));
      if (!ok) e.product = strings.errors.product;
      break;
    }
    case "quantity":
      if (a.quantity === "") e.quantity = strings.errors.quantity;
      else if (a.quantity === "other" && blank(a.quantityOther)) e.quantityOther = strings.errors.quantityOther;
      break;
    case "destination":
      if (blank(a.country)) e.country = strings.errors.country;
      break;
    case "terms":
      if (a.terms === "") e.terms = strings.errors.terms;
      break;
    case "notes":
      break;
  }
  return e;
}

/** The sheet stage reached once this step's Next (or Send) is pressed. */
export function stageFor(step: StepId): Stage {
  switch (step) {
    case "contact": return "contact";
    case "group":
    case "product": return "product";
    case "quantity": return "quantity";
    case "destination": return "destination";
    case "terms": return "terms";
    case "notes": return "submitted";
  }
}
