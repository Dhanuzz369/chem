import type { LeadPayload } from "./payload";

export type SendResult = { ok: true } | { ok: false; reason: "no-endpoint" | "timeout" | "network" | "bad-response" };

/**
 * The endpoint from NEXT_PUBLIC_LEADS_ENDPOINT. Empty, blank or "off" means none (the form then
 * ends with the WhatsApp and email buttons). "off" exists because Vercel may not store an empty
 * value, and Preview builds need a way to switch the live endpoint off.
 */
export function leadsEndpoint(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  return value.toLowerCase() === "off" ? "" : value;
}

const DEFAULT_TIMEOUT_MS = 15_000;
/** The final send creates or completes the row and the alert email, so it gets longer. */
const SUBMIT_TIMEOUT_MS = 30_000;

/**
 * Posts lead payloads to the Apps Script web app. JSON goes as text/plain so the
 * browser sends no CORS preflight (Apps Script cannot answer one). Sends are
 * single-flight per stage and body: a second, identical send while the first is in flight
 * (a double click) shares its result; a changed payload for the same stage is sent.
 */
export function createSender(opts: {
  endpoint: string | undefined;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  submitTimeoutMs?: number;
}) {
  const endpoint = leadsEndpoint(opts.endpoint);
  const inFlight = new Map<string, Promise<SendResult>>();

  async function post(payload: LeadPayload, keepalive: boolean): Promise<SendResult> {
    const fetchImpl = opts.fetchImpl ?? fetch;
    const timeoutMs =
      payload.stage === "submitted" ? (opts.submitTimeoutMs ?? SUBMIT_TIMEOUT_MS) : (opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<SendResult>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve({ ok: false, reason: "timeout" });
      }, timeoutMs);
    });
    const request = (async (): Promise<SendResult> => {
      let res: Response;
      try {
        res = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          keepalive,
          signal: controller.signal,
        });
      } catch {
        return { ok: false, reason: "network" };
      }
      if (!res.ok) return { ok: false, reason: "bad-response" };
      try {
        const body: unknown = await res.json();
        return typeof body === "object" && body !== null && (body as { ok?: unknown }).ok === true
          ? { ok: true }
          : { ok: false, reason: "bad-response" };
      } catch {
        return { ok: false, reason: "bad-response" };
      }
    })();
    try {
      return await Promise.race([request, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    send(payload: LeadPayload, sendOpts: { keepalive: boolean }): Promise<SendResult> {
      if (!endpoint) return Promise.resolve({ ok: false, reason: "no-endpoint" });
      const key = JSON.stringify(payload);
      const existing = inFlight.get(key);
      if (existing) return existing;
      const p = post(payload, sendOpts.keepalive).finally(() => inFlight.delete(key));
      inFlight.set(key, p);
      return p;
    },
  };
}
