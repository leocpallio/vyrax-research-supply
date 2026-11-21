// Single source of truth for business facts shown across the site.
// Vyrax is anonymous (Leo, 18 Nov 2026): no legal entity, company number, VAT number, registered
// office, postal address or returns address is held or shown anywhere. Do not add one.
export const SITE_URL = "https://vyraxlabs.co.uk";

const checkoutOpen =
  (import.meta as unknown as { env?: Record<string, string> }).env?.[
    "VITE_SPICEPAY_CHECKOUT_ENABLED"
  ] === "true";

export const site = {
  name: "Vyrax Labs",
  url: SITE_URL,
  tagline: "Peptides dispatched from the UK",
  // Customer mail is sent From hello@ and Reply-To support@, the only real inbox (Leo, 18 Nov 2026).
  // `email` is the one address customers are told to write to.
  senderEmail: "hello@vyraxlabs.co.uk",
  email: "support@vyraxlabs.co.uk",
  phone: "+44 7575 894339" as string | null,
  whatsapp: "447575894339" as string | null, // international format without +, e.g. '447700900000'
  supportHours: "Monday to Friday, 9am to 5pm (UK time)",
  // Fulfilment
  dispatchCutoffHour: 15, // paid orders confirmed before 3pm UK time on working days, subject to stock
  coldChainPacked: true, // operator-confirmed packing practice; transit temperature is not monitored
  minOrderValue: 25,
  freeDeliveryThreshold: 50,
  standardDeliveryFee: 4.99,
  carrier: "Royal Mail Tracked 24",
  // Payments: list only methods that are actually live at checkout.
  // Card payment uses a hosted provider page, and only while checkout is switched on.
  // Methods are listed only while that is true (see src/lib/evidence.ts).
  checkoutOpen,
  paymentMethods: (checkoutOpen ? ["Debit and credit card"] : []) as string[],
  // Leo confirmed 5 Nov 2026: enquiries are answered within one working day.
  enquiriesLive: true,
  returnWindowDays: 14,
  // No live inventory feed yet: strength availability must be confirmed before any order.
  // Switch to 'in' only once stock levels are actually tracked.
  defaultStock: "in" as import("./types").StockState,
  // Offers (mirrored in priceBasket)
  spendTiers: [
    { over: 400, rate: 0.2 },
    { over: 250, rate: 0.15 },
    { over: 150, rate: 0.1 },
  ],
  // Multi-buy candidate: each third vial's list value is tested against the single-discount cap.
  b2g1: [
    { slug: "retatrutide", strength: "10mg" },
    { slug: "tirzepatide", strength: "20mg" },
  ],
  // One discount per basket, never stacked (src/lib/discount.ts): the largest of the multi-buy,
  // the spend tier and the code. Leo 18 Nov 2026 (BLK-489).
  // Hard cap: the discount never exceeds this share of the list subtotal (server and basket).
  maxDiscountPct: 30,
  // Thin-margin lines kept out of the spend tier and the code (they sell at list). Cagrilintide
  // is not in the catalogue today; it is listed so it stays exempt if it is added.
  discountExempt: [
    { slug: "cagrilintide", strength: "5mg" },
    { slug: "ll-37", strength: "5mg" },
    { slug: "cjc-1295-dac", strength: "5mg" },
    { slug: "igf-1-lr3", strength: "1mg" },
    { slug: "thymosin-alpha-1", strength: "10mg" },
    { slug: "selank", strength: "5mg" },
    { slug: "glow", strength: "70mg" },
  ] as { slug: string; strength: string }[],
  // Free gift added automatically once goods reach `over`. Fulfilled as `quantity` real £0 order
  // lines so the packer sees them; mirrored in priceBasket and quoteCheckout. Null disables it.
  firstOrderGift: {
    slug: "bacteriostatic-water",
    strength: "10ml",
    label: "5 × Bacteriostatic Water 10ml",
    short: "5× Bac Water",
    quantity: 5,
    value: 29.95,
    over: 100,
  } as {
    slug: string;
    strength: string;
    label: string;
    short: string;
    quantity: number;
    value: number;
    over: number;
  } | null,
};

export const abs = (path: string) => SITE_URL + (path.startsWith("/") ? path : "/" + path);

/** Human-readable multi-buy ladder, e.g. "10% over £150, 15% over £250, 20% over £400".
 *  Any surface that restates the tiers must call this, never type the numbers. */
export const spendTierLine = () =>
  [...site.spendTiers]
    .sort((a, b) => a.over - b.over)
    .map((t) => `${Math.round(t.rate * 100)}% over £${t.over}`)
    .join(", ");
