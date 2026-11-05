import { sendTransactional } from "./send.server";
import { summarise, type OrderRow } from "./order-email.server";
import { orderRef } from "../checkout-form";
import { adminPaidOrderAlert } from "./v4/admin";

/**
 * Admin sale alert.
 *
 * Mirrors the UKPL wiring: every confirmed card payment emails the admin inbox straight away, so a
 * sale never sits unnoticed behind an admin dashboard. Deliberately NOT queued through the outbox:
 * the alert is an operational signal, not customer mail, and must not depend on the drain cron.
 */
export function adminEmail(env: Record<string, string | undefined> = process.env): string {
  return env["VYRAX_ADMIN_EMAIL"] || "leo.k.kallio@gmail.com";
}

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

type AlertOrder = OrderRow & {
  payment_id?: string | null;
  test_mode?: boolean | null;
  phone?: string | null;
  city?: string | null;
  address2?: string | null;
};

export function saleAlert(order: AlertOrder): { subject: string; html: string; text: string } {
  return adminPaidOrderAlert(order as never);
}

/** Sends the alert. Returns the Resend id, or null when it was skipped. Never throws. */
export async function sendSaleAlert(
  order: AlertOrder,
  eventId: string,
  deps: { env?: Record<string, string | undefined>; fetcher?: typeof fetch } = {},
): Promise<string | null> {
  if (order.test_mode) return null;
  const env = deps.env ?? process.env;
  try {
    return await sendTransactional(
      { to: adminEmail(env), mail: saleAlert(order), key: `admin-sale-${eventId}`.slice(0, 256) },
      { env, ...(deps.fetcher ? { fetcher: deps.fetcher } : {}) },
    );
  } catch (error) {
    console.error("[vyrax admin alert]", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
