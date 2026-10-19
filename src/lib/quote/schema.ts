import { z } from "zod";
import { products } from "@/content/products";

export const quantityUnits = ["kg", "MT", "L", "KL", "drums", "IBC", "containers"] as const;

const slugs = new Set(products.map((p) => p.slug));

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const quoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  country: z.string().trim().min(2).max(60),
  products: z
    .array(z.string().refine((s) => slugs.has(s), "Unknown product"))
    .min(1)
    .max(products.length),
  quantity: z.coerce.number().gt(0).max(10_000_000),
  quantityUnit: z.enum(quantityUnits),
  company: optionalText(150),
  phone: optionalText(40),
  packaging: optionalText(200),
  port: optionalText(100),
  message: optionalText(2000),
  /** Honeypot: real users never see this field, so it must stay empty. */
  website: z.string().max(500).optional(),
  /** Epoch ms when the form was first shown. */
  startedAt: z.number().optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
