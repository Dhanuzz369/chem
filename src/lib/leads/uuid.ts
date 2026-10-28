type CryptoLike = Pick<Crypto, "getRandomValues"> & { randomUUID?: () => string };

/**
 * A random RFC 4122 version 4 UUID for one form instance. Uses crypto.randomUUID where the
 * browser has it (it is missing on older browsers and on non-secure origins), otherwise
 * builds one from crypto.getRandomValues.
 */
export function newLeadId(c: CryptoLike = globalThis.crypto): string {
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
