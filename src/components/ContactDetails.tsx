import type { Contact } from "@/config/site";

type Row = { label: string; value: string; href?: string };

export function contactRows({ email, phone, whatsapp, address }: Contact): Row[] {
  return [
    email && { label: "Email", value: email, href: `mailto:${email}` },
    phone && { label: "Phone", value: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` },
    whatsapp && { label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    address && { label: "Address", value: address },
  ].filter((row): row is Row => Boolean(row));
}

/** One row per contact field that is set; renders nothing when none are. */
export function ContactDetails({ contact, className = "" }: { contact: Contact; className?: string }) {
  const rows = contactRows(contact);
  if (rows.length === 0) return null;
  return (
    <dl className={`grid gap-1 text-sm ${className}`.trim()}>
      {rows.map((row) => (
        <div key={row.label} className="flex gap-2">
          <dt className="text-ink-muted">{row.label}</dt>
          <dd>
            {row.href ? (
              <a href={row.href} className="text-brand-700 underline-offset-4 [@media(hover:hover)]:hover:underline">
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
