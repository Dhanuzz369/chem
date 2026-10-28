/**
 * Sheet values (product, quantity, packaging and terms in the lead payload) use these
 * English labels. Keep them English and stable when the UI is translated later;
 * add translations alongside rather than changing these.
 *
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

  ui: {
    stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
    next: "Next",
    back: "Back",
    send: "Send request",
    sending: "Sending…",
    retry: "Try again",
    optional: "Optional",
    headings: {
      contact: "Your contact details",
      group: "What do you need?",
      product: "Which product?",
      quantity: "How much do you need?",
      destination: "Where should it go?",
      terms: "Which shipping terms?",
      notes: "Anything else we should know?",
    },
    leads: {
      contact: "We reply with pricing and availability.",
      group: "Tap the product type.",
      product: "Tap one. You can list more in the notes.",
      quantity: "A rough idea is fine.",
      destination: "The country you are buying for.",
      terms: "Not sure? Pick “Not sure” and we will suggest one.",
      notes: "Optional. Then send your request.",
    },
    fields: {
      name: "Your name",
      company: "Company",
      email: "Email",
      emailHint: "Email or WhatsApp is enough.",
      phone: "WhatsApp or phone",
      phoneHint: "With country code, e.g. +971 50 123 4567.",
      otherProduct: "Which chemical?",
      otherProductPlaceholder: "e.g. Glycerine, CAS 56-81-5",
      quantityOther: "Amount",
      quantityOtherPlaceholder: "e.g. 20 tonnes a month",
      packaging: "Packaging",
      country: "Destination country",
      port: "Port or city",
      notes: "Notes",
      notesHint: "Grade, specification, documents you need, or timing.",
    },
    otherHint: "We source chemicals not listed here.",
    groupSample: (names: string[]) => names.join(", "),
    success: {
      heading: "Thank you. Your request is in.",
      body: (replyTo: string) =>
        replyTo
          ? `The Goodbiz Chem team will reply to ${replyTo} with pricing and availability.`
          : "The Goodbiz Chem team will reply with pricing and availability.",
    },
    failed: {
      heading: "Your request has not reached us yet",
      body: "Send it to us directly instead. Your answers are already written in.",
      whatsapp: "Send on WhatsApp",
      email: "Send by email",
    },
    noScriptContact: "You can also send your request on WhatsApp or by email:",
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
