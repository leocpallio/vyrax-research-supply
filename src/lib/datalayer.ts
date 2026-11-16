// GA4-style ecommerce pushes to window.dataLayer for the Zero Penny GTM container (GTM-WV7THGRS).
// Pure builders (no DOM, no catalog import) so bun test loads this file directly; the one browser
// function is pushDataLayer. Fields follow the agency spec, mapped to Vyrax: no pack tiers, a
// single GBP currency, money as plain 2dp numbers with no currency symbol, and NO customer data
// (no name, email, address, phone) in any push.

export const DL_CURRENCY = "GBP";

export type DlEvent = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";

/** A line with the display fields already resolved by the caller. */
export type DlLine = {
  slug: string;
  name: string;
  /** Strength label as shown, e.g. "10mg". */
  strength: string;
  /** Category display label, e.g. "Metabolic". */
  category: string;
  /** Unit price in pounds. */
  price: number;
  quantity: number;
};

export type DlItem = {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant: string;
  price: number;
  quantity: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const cleanQty = (q: number) => Math.max(1, Math.floor(Number.isFinite(q) ? q : 1));

/** item_id = lower-case slug-strength, e.g. "retatrutide-10mg". Non-alphanumerics become "-". */
export function dlItemId(slug: string, strength: string): string {
  const s = strength
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s ? `${slug.toLowerCase()}-${s}` : slug.toLowerCase();
}

export function dlItem(line: DlLine): DlItem {
  return {
    item_id: dlItemId(line.slug, line.strength),
    item_name: line.strength ? `${line.name} ${line.strength}` : line.name,
    item_category: line.category,
    item_variant: line.strength,
    price: round2(line.price),
    quantity: cleanQty(line.quantity),
  };
}

const sumValue = (items: DlItem[]) => round2(items.reduce((n, i) => n + i.price * i.quantity, 0));

/** '<event>_<Date.now()>_<random9>' for events that may repeat. Inputs injectable for tests. */
export function dlEventId(
  event: string,
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < 9; i++) r += chars[Math.floor(random() * chars.length)];
  return `${event}_${now}_${r}`;
}

/** Deterministic id so a later server-side CAPI Purchase can dedupe without a round-trip. */
export const purchaseEventId = (order: string) => `purchase_${order}`;

export type DlPayload = {
  event: DlEvent;
  event_id: string;
  ecommerce: {
    currency: typeof DL_CURRENCY;
    value: number;
    items: DlItem[];
    transaction_id?: string;
    shipping?: number;
    discount?: number;
  };
};

type Ids = { now?: number; random?: () => number };

function build(event: DlEvent, lines: DlLine[], ids: Ids = {}): DlPayload {
  const items = lines.map(dlItem);
  return {
    event,
    event_id: dlEventId(event, ids.now, ids.random),
    ecommerce: { currency: DL_CURRENCY, value: sumValue(items), items },
  };
}

export const buildViewItem = (line: DlLine, ids?: Ids): DlPayload =>
  build("view_item", [line], ids);
export const buildAddToCart = (lines: DlLine[], ids?: Ids): DlPayload =>
  build("add_to_cart", lines, ids);
export const buildBeginCheckout = (lines: DlLine[], ids?: Ids): DlPayload =>
  build("begin_checkout", lines, ids);

export type PurchaseInput = {
  /** Our real order reference (the order id on the return URL). */
  order: string;
  lines: DlLine[];
  /** What the customer paid, in pence (orders.total_pence). */
  totalPence: number;
  /** Delivery charged, in pence, if known. */
  shippingPence?: number | null | undefined;
};

export function buildPurchase(input: PurchaseInput): DlPayload {
  const items = input.lines.map(dlItem);
  const value = round2(input.totalPence / 100);
  const ecommerce: DlPayload["ecommerce"] = {
    currency: DL_CURRENCY,
    value,
    transaction_id: input.order,
    items,
  };
  if (typeof input.shippingPence === "number" && input.shippingPence >= 0) {
    const shipping = round2(input.shippingPence / 100);
    ecommerce.shipping = shipping;
    // Basket discounts (multi-buy, free vials, promo code) are not allocated to lines, so report
    // the total: goods at list price + shipping - what was paid.
    const discount = round2(sumValue(items) + shipping - value);
    if (discount > 0) ecommerce.discount = discount;
  }
  return { event: "purchase", event_id: purchaseEventId(input.order), ecommerce };
}

// ------------------------------------------------------------------ purchase single-fire guard
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export const purchaseGuardKey = (order: string) => `vx_purchase_${order}`;

/** True exactly once per order per browser session; false on a refresh or a repeat poll. */
export function claimPurchase(storage: StorageLike | null | undefined, order: string): boolean {
  if (!storage) return true;
  try {
    const key = purchaseGuardKey(order);
    if (storage.getItem(key)) return false;
    storage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

/** Whether the return page may push a purchase: paid, real money, and a known line list. */
export const mayPushPurchase = (view: string, testMode: boolean, lineCount: number) =>
  view === "paid" && !testMode && lineCount > 0;

// ------------------------------------------------------------------ browser push
type DlWindow = { dataLayer?: unknown[] };

/** Clears the previous ecommerce object, then pushes the event (GA4 / GTM best practice). */
export function pushDataLayer(payload: DlPayload, target?: DlWindow): void {
  const w: DlWindow | undefined =
    target ?? (typeof window === "undefined" ? undefined : (window as unknown as DlWindow));
  if (!w) return;
  const layer = (w.dataLayer = w.dataLayer || []);
  layer.push({ ecommerce: null });
  layer.push(payload);
}
