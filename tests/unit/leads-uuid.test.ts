import { describe, expect, it } from "vitest";
import { newLeadId } from "@/lib/leads/uuid";

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newLeadId", () => {
  it("uses crypto.randomUUID when the browser has it", () => {
    const id = newLeadId({ randomUUID: () => "11111111-2222-4333-8444-555555555555", getRandomValues: () => { throw new Error("unused"); } });
    expect(id).toBe("11111111-2222-4333-8444-555555555555");
  });

  it("builds an RFC 4122 version 4 UUID from getRandomValues when randomUUID is missing", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = newLeadId({ getRandomValues: <T extends ArrayBufferView>(a: T) => globalThis.crypto.getRandomValues(a as never) as T });
      expect(id).toMatch(V4);
      ids.add(id);
    }
    expect(ids.size).toBe(50);
  });

  it("sets the version and variant bits whatever the random bytes are", () => {
    const fill = (byte: number) => ({
      getRandomValues: <T extends ArrayBufferView>(a: T) => {
        new Uint8Array(a.buffer, a.byteOffset, a.byteLength).fill(byte);
        return a;
      },
    });
    expect(newLeadId(fill(0xff))).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(newLeadId(fill(0x00))).toBe("00000000-0000-4000-8000-000000000000");
  });
});
