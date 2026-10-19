"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { site } from "@/config/site";
import { products } from "@/content/products";
import { quantityUnits, quoteSchema } from "@/lib/quote/schema";
import { buttonClasses } from "./Button";
import { ProductPicker, type ProductOption } from "./ProductPicker";

type TextField = "name" | "company" | "email" | "phone" | "country" | "quantity" | "quantityUnit" | "packaging" | "port" | "message";
type Field = TextField | "products";
type Values = Record<TextField, string>;
type Errors = Partial<Record<Field, string>>;
type Status = { kind: "idle" | "sending" | "success" } | { kind: "failed"; reason: "rate_limited" | "server" | "invalid" };

/** DOM order, so focus always lands on the first invalid field. */
const fieldOrder: Field[] = ["name", "company", "email", "phone", "country", "products", "quantity", "quantityUnit", "packaging", "port", "message"];

const maxLengths: Partial<Record<TextField, number>> = {
  name: 100,
  company: 150,
  email: 200,
  phone: 40,
  country: 60,
  packaging: 200,
  port: 100,
  message: 2000,
};

const productOptions: ProductOption[] = products.map((p) => ({
  slug: p.slug,
  name: p.name,
  hsn: p.hsn,
  group: p.group,
  terms: [p.name, ...p.synonyms, p.hsn, ...p.cas].join(" | ").toLowerCase(),
}));
const knownSlugs = new Set(productOptions.map((o) => o.slug));

const emptyValues: Values = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  quantity: "",
  quantityUnit: "kg",
  packaging: "",
  port: "",
  message: "",
};

/** Plain-language errors. The schema decides validity; these words explain it. */
export function errorMessage(field: Field, values: Values): string {
  const max = field === "products" || field === "quantityUnit" ? undefined : maxLengths[field];
  if (max !== undefined && values[field as TextField].trim().length > max) return `Keep this under ${max} characters.`;
  switch (field) {
    case "name":
      return values.name.trim() === "" ? "Enter your name." : "Enter your full name, at least 2 characters.";
    case "email":
      return "Enter an email address like name@company.com.";
    case "country":
      return "Enter the country you are buying for.";
    case "products":
      return "Choose at least one product.";
    case "quantity":
      if (values.quantity.trim() !== "" && !Number.isFinite(Number(values.quantity))) return "Enter a number, e.g. 1000.";
      return Number(values.quantity) > 10_000_000
        ? "Enter a quantity of 10,000,000 or less."
        : "Enter a quantity greater than 0.";
    case "quantityUnit":
      return "Choose a unit.";
    default:
      return `Keep this under ${maxLengths[field] ?? 200} characters.`;
  }
}

function toPayload(values: Values, chosen: string[], website: string, startedAt: number) {
  const optional = (v: string) => (v.trim() === "" ? undefined : v.trim());
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    country: values.country.trim(),
    products: chosen,
    quantity: values.quantity.trim() === "" ? undefined : Number(values.quantity),
    quantityUnit: values.quantityUnit,
    company: optional(values.company),
    phone: optional(values.phone),
    packaging: optional(values.packaging),
    port: optional(values.port),
    message: optional(values.message),
    website,
    startedAt,
  };
}

const noop = () => () => {};

/** False in the server HTML and during hydration, true once React handles events. */
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function isField(key: string): key is Field {
  return (fieldOrder as string[]).includes(key);
}

function ContactOptions() {
  const { email, phone, whatsapp } = site.contact;
  const links = [
    email && { label: email, href: `mailto:${email}` },
    phone && { label: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` },
    whatsapp && { label: `WhatsApp ${whatsapp}`, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
  ].filter((l): l is { label: string; href: string } => Boolean(l));
  if (links.length === 0) return null;
  return (
    <p className="mt-2">
      You can also contact the team directly:{" "}
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && " · "}
          <a href={l.href} className="font-medium underline underline-offset-4">
            {l.label}
          </a>
        </span>
      ))}
    </p>
  );
}

type QuoteFormProps = {
  /** Product slugs to preselect, e.g. the product page the form sits on. */
  defaultProducts?: string[];
  /** A single-column layout for narrow spots such as product pages. */
  compact?: boolean;
};

export function QuoteForm({ defaultProducts = [], compact = false }: QuoteFormProps) {
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;
  const [values, setValues] = useState<Values>(emptyValues);
  const [chosen, setChosen] = useState<string[]>(() => defaultProducts.filter((s) => knownSlugs.has(s)));
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [website, setWebsite] = useState("");
  const startedAt = useRef(0);
  const focusTarget = useRef<Field | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  // When the form was first shown; the server uses it to drop instant bot posts.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!focusTarget.current) return;
    document.getElementById(id(focusTarget.current))?.focus();
    focusTarget.current = null;
  });

  useEffect(() => {
    if (status.kind === "success" || status.kind === "failed") resultRef.current?.focus();
  }, [status.kind]);

  /** Runs one field through the shared schema; returns an error message or undefined. */
  function check(field: Field, nextValues = values, nextChosen = chosen): string | undefined {
    const payload = toPayload(nextValues, nextChosen, "", 0);
    const result = quoteSchema.shape[field].safeParse(payload[field]);
    return result.success ? undefined : errorMessage(field, nextValues);
  }

  function setError(field: Field, message: string | undefined) {
    setErrors((prev) => {
      if (prev[field] === message) return prev;
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function update(field: TextField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field has shown an error, re-check it as the buyer types so it clears straight away.
    if (errors[field]) setError(field, check(field, next));
  }

  function updateProducts(next: string[]) {
    setChosen(next);
    if (errors.products) setError("products", check("products", values, next));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "sending") return;

    const payload = toPayload(values, chosen, website, startedAt.current);
    const parsed = quoteSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (isField(key)) next[key] ??= errorMessage(key, values);
      }
      setErrors(next);
      // A failure banner from an earlier attempt no longer applies; the field errors say what to fix.
      setStatus({ kind: "idle" });
      focusTarget.current = fieldOrder.find((f) => next[f]) ?? null;
      return;
    }

    setErrors({});
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus({ kind: "success" });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> };
      if (res.status === 400 && body.fields) {
        const next: Errors = {};
        for (const key of Object.keys(body.fields)) if (isField(key)) next[key] = errorMessage(key, values);
        const first = fieldOrder.find((f) => next[f]);
        if (first) {
          setErrors(next);
          setStatus({ kind: "idle" });
          focusTarget.current = first;
          return;
        }
        setStatus({ kind: "failed", reason: "invalid" });
        return;
      }
      setStatus({ kind: "failed", reason: res.status === 429 ? "rate_limited" : "server" });
    } catch {
      setStatus({ kind: "failed", reason: "server" });
    }
  }

  function startOver() {
    setValues(emptyValues);
    setChosen(defaultProducts.filter((s) => knownSlugs.has(s)));
    setErrors({});
    setStatus({ kind: "idle" });
    startedAt.current = Date.now();
    focusTarget.current = "name";
  }

  if (status.kind === "success") {
    const names = chosen.map((s) => productOptions.find((o) => o.slug === s)?.name ?? s);
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="enter-soft self-start rounded-lg border border-brand-200 bg-brand-50 p-6 outline-none sm:p-8"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-700">
          <circle cx="12" cy="12" r="9.25" />
          <path d="m7.75 12.25 2.75 2.75 5.75-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="mt-4 text-2xl font-semibold text-ink">Thank you. Your request is in.</h2>
        <p className="mt-2 max-w-[56ch] text-ink-muted">
          The Goodbiz Chem team will review your request for {names.join(", ")} and reply to{" "}
          <span className="font-medium text-ink">{values.email.trim()}</span>.
        </p>
        <button type="button" onClick={startOver} className={buttonClasses("secondary", "md", "mt-6")}>
          Send another request
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";
  const grid = compact ? "grid gap-5" : "grid gap-5 sm:grid-cols-2 sm:gap-x-6";

  const text = (field: TextField, label: string, props: Partial<Omit<FieldProps, "id" | "label">> & InputExtras = {}) => {
    const { type = "text", autoComplete, inputMode, required, hint, className } = props;
    return (
      <FieldShell
        id={id(field)}
        label={label}
        required={required}
        hint={hint}
        error={errors[field]}
        className={className}
      >
        {(describedBy) => (
          <input
            id={id(field)}
            name={field}
            type={type}
            autoComplete={autoComplete}
            inputMode={inputMode}
            maxLength={maxLengths[field]}
            required={required}
            aria-required={required || undefined}
            aria-invalid={errors[field] ? true : undefined}
            aria-describedby={describedBy}
            value={values[field]}
            onChange={(e) => update(field, e.target.value)}
            onBlur={() => setError(field, check(field))}
            className="field-input"
          />
        )}
      </FieldShell>
    );
  };

  return (
    <form method="post" noValidate onSubmit={onSubmit} aria-busy={sending} className="grid gap-10">
      <fieldset className="min-w-0">
        <legend className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">Your details</legend>
        <div className={`mt-5 ${grid}`}>
          {text("name", "Name", { required: true, autoComplete: "name" })}
          {text("company", "Company", { autoComplete: "organization" })}
          {text("email", "Email", { required: true, type: "email", autoComplete: "email", inputMode: "email" })}
          {text("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", hint: "With country code, if you'd like a call back." })}
          {text("country", "Country", { required: true, autoComplete: "country-name" })}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">What you need</legend>
        <div className={`mt-5 ${grid}`}>
          <FieldShell
            id={id("products")}
            label="Products"
            required
            hint="Choose one or more. Search by name, HSN code or CAS number."
            error={errors.products}
            className={compact ? "" : "sm:col-span-2"}
          >
            {(describedBy) => (
              <ProductPicker
                id={id("products")}
                options={productOptions}
                value={chosen}
                onChange={updateProducts}
                onBlur={() => setError("products", check("products"))}
                invalid={Boolean(errors.products)}
                describedBy={describedBy}
              />
            )}
          </FieldShell>

          <div className={`grid grid-cols-[minmax(0,1fr)_8.5rem] gap-3 ${compact ? "" : "sm:col-span-2 sm:max-w-md"}`}>
            {text("quantity", "Quantity", { required: true, inputMode: "decimal" })}
            <FieldShell id={id("quantityUnit")} label="Unit" required error={errors.quantityUnit}>
              {(describedBy) => (
                <div className="relative">
                  <select
                    id={id("quantityUnit")}
                    name="quantityUnit"
                    value={values.quantityUnit}
                    aria-describedby={describedBy}
                    onChange={(e) => update("quantityUnit", e.target.value)}
                    className="field-input appearance-none pr-9"
                  >
                    {quantityUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 12 12"
                    width="12"
                    height="12"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-muted"
                  >
                    <path d="m3 4.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </FieldShell>
          </div>

          {text("packaging", "Packaging", { hint: "For example 200 L drums, IBC totes or 25 kg bags." })}
          {text("port", "Destination port or city")}

          <FieldShell
            id={id("message")}
            label="Anything else"
            hint="Grade, specification, documents you need, or timing."
            error={errors.message}
            className={compact ? "" : "sm:col-span-2"}
          >
            {(describedBy) => (
              <textarea
                id={id("message")}
                name="message"
                rows={compact ? 3 : 4}
                maxLength={maxLengths.message}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={describedBy}
                value={values.message}
                onChange={(e) => update("message", e.target.value)}
                onBlur={() => setError("message", check("message"))}
                className="field-input py-3"
              />
            )}
          </FieldShell>
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input
          id={id("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {status.kind === "failed" && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="alert"
            className="enter-soft rounded-lg border border-danger-700/30 bg-danger-50 p-4 text-danger-700 outline-none sm:p-5"
          >
            <p className="font-semibold">Your request was not sent.</p>
            {status.reason === "rate_limited" ? (
              <p className="mt-1">
                There have been too many requests from your connection in the last few minutes. Please wait a little,
                then try again.
              </p>
            ) : status.reason === "invalid" ? (
              <p className="mt-1">Some details could not be accepted. Please check the form and try again.</p>
            ) : (
              <p className="mt-1">Something went wrong on our side. Your details are still here, so please try again in a few minutes.</p>
            )}
            <ContactOptions />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <button
            type="submit"
            // Before hydration a native submit would put the buyer's details in the URL, so wait.
            disabled={sending || !hydrated}
            className={buttonClasses("primary", "lg", "w-full sm:w-auto disabled:cursor-wait disabled:opacity-100!")}
          >
            {sending ? (
              <>
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" className="animate-spin">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
                  <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Sending…
              </>
            ) : (
              "Send quote request"
            )}
          </button>
          <p className="text-sm text-ink-muted">No account needed. We use your details only to reply to this request.</p>
        </div>
      </div>
    </form>
  );
}

type InputExtras = {
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "decimal";
};

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
};

/** Label above, then the control, then a hint or error. Hands the control its aria-describedby. */
function FieldShell({ id, label, required, hint, error, className = "", children }: FieldProps & { children: (describedBy?: string) => ReactNode }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-[0.9375rem] font-medium text-ink">
        {label}
        {!required && <span className="text-sm font-normal text-ink-muted">Optional</span>}
      </label>
      {children(describedBy)}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger-700">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75v3.75M8 10.9v.1" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
