import { afterEach, describe, expect, it, vi } from "vitest";
import { createSender, leadsEndpoint } from "@/lib/leads/send";
import type { LeadPayload } from "@/lib/leads/payload";

const payload = (stage: string): LeadPayload => ({ leadId: "lead-1234", stage, name: "Asha" });
const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

afterEach(() => vi.useRealTimers());

describe("createSender", () => {
  it("sender posts text/plain JSON with keepalive and times out at 15s", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {}));
    const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl });
    const pending = sender.send(payload("contact"), { keepalive: true });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://script.example/exec");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe("text/plain;charset=utf-8");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(String(init.body))).toEqual(payload("contact"));

    await vi.advanceTimersByTimeAsync(14_999);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual({ ok: false, reason: "timeout" });
  });

  it("the final submitted send waits 30s before timing out; other stages 15s", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {}));
    const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl });
    let contact: unknown, submitted: unknown;
    void sender.send(payload("contact"), { keepalive: true }).then((r) => (contact = r));
    void sender.send(payload("submitted"), { keepalive: false }).then((r) => (submitted = r));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(contact).toEqual({ ok: false, reason: "timeout" });
    expect(submitted).toBeUndefined();
    await vi.advanceTimersByTimeAsync(14_999);
    expect(submitted).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(submitted).toEqual({ ok: false, reason: "timeout" });
  });

  it("passes keepalive false through and succeeds on {ok:true}", async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl });
    await expect(sender.send(payload("submitted"), { keepalive: false })).resolves.toEqual({ ok: true });
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.keepalive).toBe(false);
  });

  it("leadsEndpoint treats empty, blank and \"off\" as no endpoint", () => {
    expect(leadsEndpoint(undefined)).toBe("");
    expect(leadsEndpoint("  ")).toBe("");
    expect(leadsEndpoint("off")).toBe("");
    expect(leadsEndpoint(" OFF ")).toBe("");
    expect(leadsEndpoint(" https://script.google.com/macros/s/x/exec ")).toBe("https://script.google.com/macros/s/x/exec");
  });

  it("sender with no endpoint fails fast", async () => {
    for (const endpoint of [undefined, "", "   "]) {
      const fetchImpl = vi.fn(async () => okResponse());
      const sender = createSender({ endpoint, fetchImpl });
      await expect(sender.send(payload("contact"), { keepalive: true })).resolves.toEqual({
        ok: false, reason: "no-endpoint",
      });
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("sender is single-flight per stage", async () => {
    let resolve!: (r: Response) => void;
    const fetchImpl = vi.fn(() => new Promise<Response>((r) => (resolve = r)));
    const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl });
    const one = sender.send(payload("submitted"), { keepalive: false });
    const two = sender.send(payload("submitted"), { keepalive: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    resolve(okResponse());
    const [r1, r2] = await Promise.all([one, two]);
    expect(r1).toEqual({ ok: true });
    expect(r2).toBe(r1);

    // Once settled, the same stage can be sent again (a retry).
    const fetchAgain = vi.fn(async () => okResponse());
    const s2 = createSender({ endpoint: "https://script.example/exec", fetchImpl: fetchAgain });
    await s2.send(payload("contact"), { keepalive: true });
    await s2.send(payload("contact"), { keepalive: true });
    expect(fetchAgain).toHaveBeenCalledTimes(2);
  });

  it("a changed payload for a stage in flight is sent, not merged into the old one", async () => {
    const fetchImpl = vi.fn(() => new Promise<Response>(() => {}));
    const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl });
    // Step 2 Next and step 3 Next both send stage "product"; the second carries the product.
    void sender.send({ ...payload("product"), group: "Solvents" }, { keepalive: true });
    void sender.send({ ...payload("product"), group: "Solvents", product: "Methanol" }, { keepalive: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("sender treats {ok:false} or non-JSON as bad-response", async () => {
    const cases = [
      new Response(JSON.stringify({ ok: false, error: "busy" }), { status: 200 }),
      new Response("<html>oops</html>", { status: 200 }),
      new Response(JSON.stringify({ ok: true }), { status: 500 }),
    ];
    for (const res of cases) {
      const sender = createSender({ endpoint: "https://script.example/exec", fetchImpl: vi.fn(async () => res) });
      await expect(sender.send(payload("contact"), { keepalive: true })).resolves.toEqual({
        ok: false, reason: "bad-response",
      });
    }
  });

  it("a rejected fetch is a network failure", async () => {
    const sender = createSender({
      endpoint: "https://script.example/exec",
      fetchImpl: vi.fn(async () => { throw new TypeError("Failed to fetch"); }),
    });
    await expect(sender.send(payload("contact"), { keepalive: true })).resolves.toEqual({
      ok: false, reason: "network",
    });
  });
});
