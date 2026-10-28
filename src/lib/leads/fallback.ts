import { packagingLabels, productLabel, quantityLabel, termsLabel } from "./options";
import type { Answers } from "./steps";
import { strings } from "./strings";

/** wa.me form of +91 8884799369. */
export const LEADS_WHATSAPP = "918884799369";
export const LEADS_EMAIL = "chemicals@goodbizglobal.com";

const NOTES_MAX = 1000;

/** Keeps the links short enough for WhatsApp and mail apps. */
function capNotes(notes: string): string {
  return notes.length > NOTES_MAX ? `${notes.slice(0, NOTES_MAX)}…` : notes;
}

/** The whole request as plain text, one "Label: value" line per answer given. */
export function requestSummary(a: Answers): string {
  const s = strings.summary;
  const isOther = a.group === "other";
  const listed = a.group !== "" && !isOther;
  const quantity =
    a.quantity === "other" ? a.quantityOther.trim() || quantityLabel(a.quantity) : quantityLabel(a.quantity);
  const rows: [string, string][] = [
    [s.name, a.name.trim()],
    [s.company, a.company.trim()],
    [s.email, a.email.trim()],
    [s.phone, a.phone.trim()],
    [s.group, listed ? a.group : ""],
    [s.product, productLabel(a.group, a.product)],
    [s.otherProduct, isOther ? a.otherProduct.trim() : ""],
    [s.quantity, quantity],
    [s.packaging, packagingLabels(a.packaging)],
    [s.country, a.country.trim()],
    [s.port, a.port.trim()],
    [s.terms, termsLabel(a.terms)],
    [s.notes, capNotes(a.notes.trim())],
  ];
  return [s.heading, "", ...rows.filter(([, v]) => v !== "").map(([k, v]) => `${k}: ${v}`)].join("\n");
}

function subject(a: Answers): string {
  const what =
    a.group === "other"
      ? a.otherProduct.trim()
      : (a.product !== "any" ? productLabel(a.group, a.product) : "") || a.group;
  return what ? `${strings.summary.subject}: ${what}` : strings.summary.subject;
}

/** Links that hand the whole request to WhatsApp or the buyer's email app when sending fails. */
export function fallbackLinks(a: Answers): { whatsapp: string; email: string } {
  const text = requestSummary(a);
  return {
    whatsapp: `https://wa.me/${LEADS_WHATSAPP}?text=${encodeURIComponent(text)}`,
    email: `mailto:${LEADS_EMAIL}?subject=${encodeURIComponent(subject(a))}&body=${encodeURIComponent(text).replace(/%0A/g, "%0D%0A")}`,
  };
}
