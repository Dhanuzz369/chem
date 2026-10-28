import { site } from "@/config/site";
import { packagingLabels, productLabel, quantityLabel, termsLabel } from "./options";
import type { Answers } from "./steps";
import { strings } from "./strings";

/** Where the fallback links go: the WhatsApp number (wa.me digits) and email in site.contact. */
export const LEADS_WHATSAPP = (site.contact.whatsapp ?? site.contact.phone ?? "").replace(/\D/g, "");
export const LEADS_EMAIL = site.contact.email ?? "";

/** Keeps the links short enough to open: WhatsApp takes long text, and mailto: links break sooner. */
const NOTES_MAX = 1000;
const EMAIL_NOTES_MAX = 600;

function capNotes(notes: string, max: number): string {
  return notes.length > max ? `${notes.slice(0, max)}…` : notes;
}

/** The whole request as plain text, one "Label: value" line per answer given. */
export function requestSummary(a: Answers, notesMax = NOTES_MAX): string {
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
    [s.notes, capNotes(a.notes.trim(), notesMax)],
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
  const body = encodeURIComponent(requestSummary(a, EMAIL_NOTES_MAX)).replace(/%0A/g, "%0D%0A");
  return {
    whatsapp: `https://wa.me/${LEADS_WHATSAPP}?text=${encodeURIComponent(requestSummary(a))}`,
    email: `mailto:${LEADS_EMAIL}?subject=${encodeURIComponent(subject(a))}&body=${body}`,
  };
}
