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
type AnswerKey = Exclude<(typeof PAYLOAD_KEYS)[number], "leadId" | "stage" | "sourcePage" | "userAgent">;

function sheetValues(a: Answers): Record<AnswerKey, string> {
  const isOther = a.group === "other";
  const listed = a.group !== "" && !isOther;
  return {
    name: a.name.trim(),
    company: a.company.trim(),
    email: a.email.trim(),
    phone: a.phone.trim(),
    group: listed ? a.group : "",
    product: productLabel(a.group, a.product),
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
 * field never sent stays "". Keep everSent up to date with nextEverSent().
 */
export function buildPayload(
  leadId: string,
  stage: string,
  a: Answers,
  everSent: ReadonlySet<string>,
  meta: { sourcePage: string; userAgent: string },
): LeadPayload {
  const answers = sheetValues(a);
  const out: LeadPayload = { leadId, stage };
  for (const key of PAYLOAD_KEYS) {
    if (key === "leadId" || key === "stage") continue;
    if (key === "sourcePage" || key === "userAgent") {
      out[key] = meta[key];
      continue;
    }
    const value = answers[key];
    out[key] = value !== "" ? value : everSent.has(key) ? CLEAR : "";
  }
  return out;
}

/**
 * The keys the sheet may now hold a value for: prev plus every payload key with a value
 * (not "" and not "__clear__"). The caller MUST apply this every time a payload is built
 * and a send is attempted, whatever the result: a timed-out or failed request may still
 * have reached the sheet, so later sends must be able to clear what it wrote.
 */
export function nextEverSent(prev: ReadonlySet<string>, payload: LeadPayload): Set<string> {
  const next = new Set(prev);
  for (const [key, value] of Object.entries(payload)) {
    if (value !== "" && value !== CLEAR) next.add(key);
  }
  return next;
}
