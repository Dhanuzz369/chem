import { isSpam, rateLimit } from "@/lib/quote/guard";
import { quoteSchema } from "@/lib/quote/schema";
import { getQuoteStore, type QuoteRecord } from "@/lib/quote/store";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!rateLimit(ip, now)) return json({ ok: false, error: "rate_limited" }, 429);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "invalid", fields: {} }, 400);
  }

  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fields[k] ??= issue.message;
    }
    return json({ ok: false, error: "invalid", fields }, 400);
  }

  const { website, startedAt, ...rest } = parsed.data;
  if (isSpam({ website, startedAt }, now)) return json({ ok: true });

  const record: QuoteRecord = { ...rest, submittedAt: new Date(now).toISOString(), source: "website" };
  try {
    await getQuoteStore().save(record);
  } catch (e) {
    // Messages hold only env var names and HTTP statuses; never log the submission.
    console.error("quote save failed:", e instanceof Error ? e.message : "unknown");
    return json({ ok: false, error: "save_failed" }, 500);
  }
  return json({ ok: true });
}
