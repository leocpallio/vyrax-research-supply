import { findPromo } from "../data/promos";

/** FIRST10 is a first-paid-order code. Server-authoritative: only a webhook-confirmed
 *  status = 'paid' order spends it. Pending/failed attempts never do, so retries still work.
 *  Fails closed: any lookup error rejects the code rather than treating the buyer as new. */
export type PaidOrderCounter = (emailPattern: string) => Promise<{ count: number | null; error: unknown }>;

export type GateResult = { ok: true } | { ok: false; status: 400 | 503; message: string };

/** Escape LIKE wildcards so ilike matches the address exactly, ignoring case. */
export const emailIlikePattern = (email: string) => email.trim().replace(/[\\%_]/g, "\\$&");

export async function checkFirstOrderCode(
  code: string | null | undefined,
  email: string,
  countPaid: PaidOrderCounter,
): Promise<GateResult> {
  if (!findPromo(code)) return { ok: true };
  let res: Awaited<ReturnType<PaidOrderCounter>>;
  try {
    res = await countPaid(emailIlikePattern(email));
  } catch {
    return { ok: false, status: 503, message: "We could not check your code just now. Please try again." };
  }
  if (res.error || typeof res.count !== "number")
    return { ok: false, status: 503, message: "We could not check your code just now. Please try again." };
  if (res.count > 0)
    return { ok: false, status: 400, message: "That code has already been used on a previous order" };
  return { ok: true };
}
