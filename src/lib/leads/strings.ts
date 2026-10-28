/**
 * Every English string the quote form shows or writes. Keep copy here only,
 * so another language can be added later as a content job.
 */
export const strings = {
  groupOther: "Something else",
  productAny: "Any / not sure",

  quantity: {
    trial: "Trial / sample",
    "one-container": "1 container",
    "two-to-five": "2–5 containers",
    monthly: "Regular monthly supply",
    "not-sure": "Not sure yet",
    other: "Another amount",
  },
  packaging: {
    drums: "Drums",
    ibc: "IBC tanks",
    bags: "Bags",
    bulk: "Bulk tanker / ISO tank",
    "not-sure": "Not sure",
  },
  terms: {
    fob: { label: "FOB", hint: "You arrange shipping from the Indian port." },
    cfr: { label: "CFR", hint: "We ship to your port; you insure." },
    cif: { label: "CIF", hint: "We ship and insure to your port." },
    "delivered-india": { label: "Delivered within India", hint: "For buyers in India." },
    "not-sure": { label: "Not sure", hint: "We'll suggest the best option." },
  },

  errors: {
    name: "Please enter your name.",
    contactMissing: "Email or WhatsApp is enough.",
    emailInvalid: "Please check the email address, or add a WhatsApp number instead.",
    phoneInvalid: "Please check the number (at least 7 digits), or add an email instead.",
    group: "Please choose a product type.",
    otherProduct: "Please tell us which chemical you need.",
    product: "Please choose a product, or “Any / not sure”.",
    quantity: "Please choose a quantity, or “Not sure yet”.",
    quantityOther: "Please tell us the amount.",
    country: "Please enter the destination country.",
    terms: "Please choose shipping terms, or “Not sure”.",
  },

  summary: {
    heading: "Quote request from the Goodbiz Chem website",
    name: "Name",
    company: "Company",
    email: "Email",
    phone: "WhatsApp / phone",
    group: "Product type",
    product: "Product",
    otherProduct: "Chemical (not listed)",
    quantity: "Quantity",
    packaging: "Packaging",
    country: "Destination country",
    port: "Port / city",
    terms: "Shipping terms",
    notes: "Notes",
    subject: "Quote request",
  },
} as const;
