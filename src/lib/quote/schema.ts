import { z } from "zod";
import { products } from "@/content/products";

export const quantityUnits = ["kg", "MT", "L", "KL", "drums", "IBC", "containers"] as const;

const slugs = new Set(products.map((p) => p.slug));

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const OTHER_PRODUCT_MAX = 300;
export const productOrOtherMessage = "Choose a product or describe the chemical you need.";

/** A request names at least one listed product, or describes a chemical that is not listed. */
export function hasProductOrOther(v: { products?: unknown; otherProduct?: unknown }): boolean {
  return (
    (Array.isArray(v.products) && v.products.length > 0) ||
    (typeof v.otherProduct === "string" && v.otherProduct.trim() !== "")
  );
}

export const quoteSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(200),
    country: z.string().trim().min(2).max(60),
    products: z
      .array(z.string().refine((s) => slugs.has(s), "Unknown product"))
      .max(products.length)
      // A request may name only a chemical that is not listed; the refinement below asks for one or the other.
      .default([]),
    quantity: z.coerce.number().gt(0).max(10_000_000),
    quantityUnit: z.enum(quantityUnits),
    company: optionalText(150),
    phone: optionalText(40),
    packaging: optionalText(200),
    port: optionalText(100),
    message: optionalText(2000),
    /** A chemical that is not on the list: name, grade, CAS number or specification. */
    otherProduct: optionalText(OTHER_PRODUCT_MAX),
    /** Honeypot: real users never see this field, so it must stay empty. */
    website: z.string().max(500).optional(),
    /** Epoch ms when the form was first shown. */
    startedAt: z.number().optional(),
  })
  .refine(hasProductOrOther, {
    path: ["products"],
    message: productOrOtherMessage,
    // Run even when other fields are invalid, so an empty form reports this alongside the rest.
    when: ({ value }) => typeof value === "object" && value !== null,
  });

export type QuoteInput = z.infer<typeof quoteSchema>;
