import { JWT } from "google-auth-library";
import { getProduct } from "@/content/products";
import type { QuoteRecord, QuoteStore } from "./store";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TIMEOUT_MS = 10_000;

type Env = Record<string, string | undefined>;

/** Errors thrown by this store carry only env var names, HTTP statuses and auth messages, so they are safe to log. */
export class SheetsStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsStoreError";
  }
}

/** A plain phone number such as "+91 98765 43210": safe to store without a leading apostrophe. */
const PLAIN_PHONE = /^\+[\d\s().-]+$/;

/** Neutralise spreadsheet formula injection by prefixing risky leading characters. */
export function safeCell(v: string): string {
  if (PLAIN_PHONE.test(v)) return v;
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

/** Vercel's dashboard keeps quotes pasted around a value; strip them, then turn each literal backslash-n into a newline. */
function parsePrivateKey(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

async function getToken(email: string, key: string): Promise<string> {
  const jwt = new JWT({ email, key, scopes: [SCOPE] });
  let token: string | null | undefined;
  try {
    ({ token } = await jwt.getAccessToken());
  } catch (err) {
    // Google auth errors describe the key or grant, never the quote, so the message is safe to log.
    throw new SheetsStoreError(`Google auth failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!token) throw new SheetsStoreError("No Google access token");
  return token;
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
      const key = parsePrivateKey(need(env, "GOOGLE_PRIVATE_KEY"));
      const range = env.GOOGLE_SHEET_RANGE || "Quotes!A:M";

      const token = await getToken(email, key);

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
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ values: [row] }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (err) {
        if (err instanceof Error && err.name === "TimeoutError") throw new SheetsStoreError("Sheets request timed out");
        throw new SheetsStoreError(`Sheets request failed: ${err instanceof Error ? err.name : "unknown"}`);
      }
      if (!res.ok) throw new SheetsStoreError(`Sheets append failed: ${res.status}`);
    },
  };
}
