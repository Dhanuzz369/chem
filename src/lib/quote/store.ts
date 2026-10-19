import type { QuoteInput } from "./schema";
import { createSheetsStore } from "./sheets-store";

export type QuoteRecord = Omit<QuoteInput, "website" | "startedAt"> & {
  submittedAt: string;
  source: string;
};

/**
 * The only seam between the quote API and where quotes end up. To move to a
 * CRM, or to alert the team, swap or wrap the store returned by getQuoteStore().
 */
export interface QuoteStore {
  save(r: QuoteRecord): Promise<void>;
}

let override: QuoteStore | undefined;
let sheets: QuoteStore | undefined;

export function getQuoteStore(): QuoteStore {
  if (override) return override;
  return (sheets ??= createSheetsStore(process.env));
}

export function setQuoteStoreForTests(s: QuoteStore | undefined): void {
  override = s;
}
