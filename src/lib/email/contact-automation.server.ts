// Contact-level delivery: welcome d1-d3, basket 1 and 2, back in stock. Driven by the same cron
// call and the same enable flag as the order queue (see automation.server.ts). Every row is
// claimed in SQL, re-checked in SQL immediately before sending, and verified against Resend so an
// unsubscribe made there always wins. Nothing here creates consent.
import { promos } from "../../data/promos";
import { priceBasket } from "../basket-pricing";
import {
  UNSUBSCRIBE_BASE,
  findVariant,
  isTestAddress,
  parseCartItems,
  verifyResendContact,
  type CartLine,
  type Env,
} from "./contact-shared.server";
import { unsubscribeMarketing, type Rpc } from "./outbox.server";
import type { RenderedEmail } from "./templates";
import { welcomeD1, welcomeD2, welcomeD3, cart1Code, cart1NoCode, cart2, backInStock } from "./v4/welcome";

export type ContactKind =
  | "welcomeD1"
  | "welcomeD2"
  | "welcomeD3"
  | "cart1"
  | "cart2"
  | "backInStock";
export type ContactRow = {
  id: string;
  email: string;
  kind: ContactKind;
  event_key: string;
  payload: unknown;
  claim_token: string;
  unsubscribe_token: string | null;
};
export type ContactMessage = { to: string; mail: RenderedEmail; key: string };
export type ContactDependencies = {
  env?: Env;
  db: Rpc;
  send: (message: ContactMessage) => Promise<string>;
  fetcher?: typeof fetch;
};
export type ContactStats = { claimed: number; sent: number; failed: number };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const kinds: ContactKind[] = ["welcomeD1", "welcomeD2", "welcomeD3", "cart1", "cart2", "backInStock"];

/** The welcome code only goes in basket 1 while the promo exists and still applies to this basket. */
export function cartCodeStillValid(items: CartLine[]): boolean {
  const code = promos[0]?.code;
  if (!code) return false;
  const priced = items.flatMap((i) => {
    const f = findVariant(i.slug, i.strength);
    return f
      ? [{ slug: i.slug, name: f.product.name, strength: i.strength, quantity: i.quantity, price: f.variant.price }]
      : [];
  });
  if (priced.length !== items.length) return false;
  return priceBasket(priced, code).promo !== undefined;
}

export function contactMailFor(row: ContactRow): RenderedEmail {
  if (!row.unsubscribe_token || !uuid.test(row.unsubscribe_token))
    throw new Error("Missing unsubscribe token");
  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}${row.unsubscribe_token}`;
  const ctx = { unsubscribeUrl };
  const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<
    string,
    unknown
  >;
  let mail: RenderedEmail;
  switch (row.kind) {
    case "welcomeD1":
      mail = welcomeD1(ctx);
      break;
    case "welcomeD2":
      mail = welcomeD2(ctx);
      break;
    case "welcomeD3":
      mail = welcomeD3(ctx);
      break;
    case "cart1":
    case "cart2": {
      const items = parseCartItems(payload["items"]);
      if (!items) throw new Error("Saved basket is not valid");
      if (row.kind === "cart2") mail = cart2({ ...ctx, items });
      else
        mail = cartCodeStillValid(items) ? cart1Code({ ...ctx, items }) : cart1NoCode({ ...ctx, items });
      break;
    }
    case "backInStock": {
      const slug = payload["slug"];
      const strength = payload["strength"];
      if (typeof slug !== "string" || typeof strength !== "string" || !findVariant(slug, strength))
        throw new Error("Stock request is not valid");
      mail = backInStock({ ...ctx, slug, strength });
      break;
    }
    default:
      throw new Error("Unknown contact email kind");
  }
  if (!mail.subject || !mail.html || !mail.text) throw new Error("Email template unavailable");
  // One-click unsubscribe on every contact email, whatever the template chose.
  return { ...mail, listUnsubscribe: unsubscribeUrl };
}

async function call(db: Rpc, name: string, args: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(`Contact outbox ${name} failed`);
  return data;
}

async function finish(db: Rpc, row: ContactRow, ok: boolean, providerId?: string): Promise<boolean> {
  return (
    (await call(db, "finish_contact_outbox", {
      p_id: row.id,
      p_claim_token: row.claim_token,
      p_success: ok,
      p_provider_id: providerId ?? null,
      p_error: ok ? null : "delivery failed",
    })) === true
  );
}

/** Claims up to `limit` contact rows and delivers them. Throws only when the claim itself fails. */
export async function runContactQueue(
  deps: ContactDependencies,
  limit = 20,
): Promise<ContactStats> {
  const env = deps.env ?? process.env;
  const { db } = deps;
  const claimed = await call(db, "claim_contact_outbox", { p_limit: limit });
  if (!Array.isArray(claimed)) throw new Error("Invalid contact claim response");
  const rows = (claimed as ContactRow[]).filter(
    (r) => r && uuid.test(r.id) && uuid.test(r.claim_token),
  );
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      if (!kinds.includes(row.kind)) throw new Error("Unknown contact email kind");
      if (isTestAddress(row.email)) throw new Error("Test address skipped");
      if (!(await verifyResendContact(row.email, row.unsubscribe_token, env, deps.fetcher ?? fetch))) {
        // Resend is the source of truth: mirror the opt-out into SQL so no queue sends again.
        await unsubscribeMarketing(db, row.unsubscribe_token!);
        throw new Error("Marketing unsubscribed");
      }
      // Consent, paid-order and age checks again, immediately before network delivery.
      const eligible = await call(db, "recheck_contact_outbox", {
        p_id: row.id,
        p_claim_token: row.claim_token,
      });
      if (eligible !== true) throw new Error("Email no longer eligible");
      const providerId = await deps.send({
        to: row.email,
        mail: contactMailFor(row),
        key: `vyrax-contact:${row.id}`,
      });
      if (!(await finish(db, row, true, providerId))) throw new Error("Email claim lost after send");
      sent++;
    } catch (error) {
      failed++;
      console.error("[vyrax contact outbox]", error instanceof Error ? error.message : "delivery failed");
      try {
        await finish(db, row, false);
      } catch {
        /* the lease expires and the row is retried or cancelled by the claim function */
      }
    }
  }
  return { claimed: rows.length, sent, failed };
}
