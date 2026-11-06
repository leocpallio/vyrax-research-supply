/** Personal welcome codes: issued by the site popup, bound to the email address that claimed
 *  them and valid once, on that address's first order. Generation and verification need the
 *  server secret, so they live in welcome-code.server.ts; everything here is pure. */

export const WELCOME_PREFIX = "WELCOME-";
export const WELCOME_PCT = 10;
export const WELCOME_MIN_SPEND = 50;

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export const isWelcomeCode = (code?: string | null) =>
  (code ?? "").trim().toUpperCase().startsWith(WELCOME_PREFIX);

export const isWellFormedWelcomeCode = (code?: string | null) => {
  const c = (code ?? "").trim().toUpperCase();
  return c.startsWith(WELCOME_PREFIX) && /^WELCOME-[A-Z0-9]{7}$/.test(c);
};
