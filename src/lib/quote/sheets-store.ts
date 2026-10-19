import { JWT } from "google-auth-library";
import { getProduct } from "@/content/products";
import type { QuoteRecord, QuoteStore } from "./store";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TIMEOUT_MS = 10_000;

type Env = Record<string, string | undefined>;

/**
 * Errors thrown by this store carry only env var names, HTTP statuses, OAuth error
 * codes and error names, never upstream message text, so they are safe to log.
 */
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

/** "+", a digit, then digits, spaces and brackets only: no "-" or ".", so it cannot form arithmetic. */
const PLAIN_PHONE = /^\+\d[\d ()]{0,38}$/;

/** For the phone column only: a plain number such as "+91 98765 43210" is kept as typed; anything else gets safeCell. */
export function phoneCell(v: string): string {
  return PLAIN_PHONE.test(v) ? v : safeCell(v);
}

const OAUTH_ERROR_CODES = ["invalid_grant", "invalid_client", "unauthorized_client", "access_denied", "invalid_scope"];

/** A stable, PII-free label for an auth failure: a known OAuth code if present, else the error's name. */
function authFailureReason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return OAUTH_ERROR_CODES.find((code) => message.includes(code)) ?? (err instanceof Error ? err.name : "unknown");
}

/** Vercel's dashboard keeps quotes pasted around a value; strip them, then turn each literal backslash-n into a newline. */
function parsePrivateKey(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

async function getToken(email: string, key: string): Promise<string> {
  const jwt = new JWT({ email, key, scopes: [SCOPE] });
  const timedOut = new SheetsStoreError("Google auth timed out");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let token: string | null | undefined;
  try {
    ({ token } = await Promise.race([
      jwt.getAccessToken(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(timedOut), TIMEOUT_MS);
      }),
    ]));
  } catch (err) {
    if (err === timedOut) throw err;
    throw new SheetsStoreError(`Google auth failed: ${authFailureReason(err)}`);
  } finally {
    clearTimeout(timer);
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
        phoneCell(r.phone ?? ""),
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
