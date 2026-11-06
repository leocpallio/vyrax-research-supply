import {
  WELCOME_PCT,
  WELCOME_PREFIX,
  isWellFormedWelcomeCode,
  normaliseEmail,
} from "./welcome-code";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32, no I/L/O/U

const secretKey = () => {
  const secret = process.env["WELCOME_CODE_SECRET"];
  if (!secret) throw new Error("Welcome code secret missing");
  return secret;
};

/** Deterministic per-address code: the same email always yields the same code, so issuing
 *  costs no storage and verification needs nothing but the address. */
export async function welcomeCodeFor(email: string): Promise<string> {
  const data = new TextEncoder().encode(`vyrax-welcome-v1:${normaliseEmail(email)}`);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  let out = "";
  for (let i = 0; i < 7; i++) out += ALPHABET[mac[i]! % 32];
  return `${WELCOME_PREFIX}${out}`;
}

/** Constant-time-ish comparison; both sides are public codes, but keep it tidy. */
export async function verifyWelcomeCode(email: string, code: string): Promise<boolean> {
  if (!isWellFormedWelcomeCode(code)) return false;
  const expected = await welcomeCodeFor(email);
  if (expected.length !== code.trim().toUpperCase().length) return false;
  let diff = 0;
  const a = expected.toUpperCase();
  const b = code.trim().toUpperCase();
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const welcomeCodeTerms = () => ({
  pct: WELCOME_PCT,
  minGoodsPence: 5000,
});
