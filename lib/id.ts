// ID helpers. Share IDs must NOT be guessable — 10 chars of crypto randomness
// over a 36-char alphabet (~51 bits).

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function shortId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// Stable per-row/add-on identifiers. crypto.randomUUID is available in modern
// browsers and Node 19+.
export function uuid(): string {
  return crypto.randomUUID();
}
