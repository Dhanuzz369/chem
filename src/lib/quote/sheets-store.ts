import { JWT } from "google-auth-library";
import { getProduct } from "@/content/products";
import type { QuoteRecord, QuoteStore } from "./store";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

type Env = Record<string, string | undefined>;

/** Errors thrown by this store carry only env var names and HTTP statuses, so they are safe to log. */
export class SheetsStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsStoreError";
  }
}

/** Neutralise spreadsheet formula injection by prefixing risky leading characters. */
export function safeCell(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

function need(env: Env, key: string): string {
  const v = env[key];
  if (!v) throw new SheetsStoreError(`Missing env var ${key}`);
  return v;
}

export function createSheetsStore(env: Env): QuoteStore {
  return {
    async save(r: QuoteRecord) {
      const sheetId = need(env, "GOOGLE_SHEET_ID");
      const email = need(env, "GOOGLE_SERVICE_ACCOUNT_EMAIL");
      const key = need(env, "GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
      const range = env.GOOGLE_SHEET_RANGE || "Quotes!A:M";

      const jwt = new JWT({ email, key, scopes: [SCOPE] });
      const { token } = await jwt.getAccessToken();
      if (!token) throw new SheetsStoreError("No Google access token");

      const row = [
        r.submittedAt,
        safeCell(r.name),
        safeCell(r.company ?? ""),
        safeCell(r.email),
        safeCell(r.phone ?? ""),
        safeCell(r.country),
        r.products.map((s) => getProduct(s)?.name ?? s).join(", "),
        r.quantity,
        r.quantityUnit,
        safeCell(r.packaging ?? ""),
        safeCell(r.port ?? ""),
        safeCell(r.message ?? ""),
        r.source,
      ];

      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}` +
        `/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] }),
      });
      if (!res.ok) throw new SheetsStoreError(`Sheets append failed: ${res.status}`);
    },
  };
}
