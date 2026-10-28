import { packagingLabels, productLabel, quantityLabel, termsLabel } from "./options";
import type { Answers } from "./steps";

/** Must equal CLEAR in apps-script/leads/Code.gs. */
export const CLEAR = "__clear__";

/** The Apps Script HEADERS minus the server-side firstSeen and updated. */
export const PAYLOAD_KEYS = [
  "leadId", "stage",
  "name", "company", "email", "phone",
  "group", "product", "otherProduct",
  "quantity", "quantityOther", "packaging",
  "country", "port", "terms", "notes",
  "sourcePage", "userAgent",
] as const;

export type LeadPayload = Record<string, string> & { leadId: string; stage: string };

/** Each answer as it should read in the sheet, with answers that no longer apply left empty. */
function sheetValues(a: Answers): Record<string, string> {
  const isOther = a.group === "other";
  const listed = a.group !== "" && !isOther;
  return {
    name: a.name.trim(),
    company: a.company.trim(),
    email: a.email.trim(),
    phone: a.phone.trim(),
    group: listed ? a.group : "",
    product: listed ? productLabel(a.product) : "",
    otherProduct: isOther ? a.otherProduct.trim() : "",
    quantity: quantityLabel(a.quantity),
    quantityOther: a.quantity === "other" ? a.quantityOther.trim() : "",
    packaging: packagingLabels(a.packaging),
    country: a.country.trim(),
    port: a.port.trim(),
    terms: termsLabel(a.terms),
    notes: a.notes.trim(),
  };
}

/**
 * The full answer set for one send. A field that is now empty but was sent before
 * (listed in everSent) becomes "__clear__" so the sheet drops the old answer; an empty
 * field never sent stays "". The caller adds every key sent with a value to everSent.
 */
export function buildPayload(
  leadId: string,
  stage: string,
  a: Answers,
  everSent: ReadonlySet<string>,
  meta: { sourcePage: string; userAgent: string },
): LeadPayload {
  const out: LeadPayload = { leadId, stage };
  for (const [key, value] of Object.entries(sheetValues(a))) {
    out[key] = value !== "" ? value : everSent.has(key) ? CLEAR : "";
  }
  out.sourcePage = meta.sourcePage;
  out.userAgent = meta.userAgent;
  return out;
}
