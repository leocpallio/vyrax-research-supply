// Single source of truth for business facts shown across the site.
// Anything set to null renders as "being finalised" rather than inventing a value.
export const SITE_URL = "https://vyraxlabs.co.uk";

const checkoutOpen =
  (import.meta as unknown as { env?: Record<string, string> }).env?.[
    "VITE_SPICEPAY_CHECKOUT_ENABLED"
  ] === "true";

export const site = {
  name: "Vyrax Labs",
  url: SITE_URL,
  tagline: "Peptides dispatched from the UK",
  // Business details: fill these in before launch. Null values are shown as pending.
  legalName: null as string | null,
  companyNumber: null as string | null,
  vatNumber: null as string | null,
  registeredOffice: null as string | null,
  // Physical address a return can be sent to. Null means returns are handled by arrangement only;
  // src/lib/claims.ts then withholds any "returns address" line instead of printing a fake one.
  returnsAddress: null as string | null,
  email: "support@vyraxlabs.co.uk",
  // Verified, owned profile URLs only (Organization.sameAs). Leave empty rather than guess: a
  // sameAs pointing at an account we do not control is a false entity statement. Add an entry the
  // day the profile exists and its bio names Vyrax Labs.
  sameAs: [] as string[],
  phone: "+44 7575 894339" as string | null,
  whatsapp: "447575894339" as string | null, // international format without +, e.g. '447700900000'
  supportHours: "Monday to Friday, 9am to 5pm (UK time)",
  // Fulfilment
  dispatchCutoffHour: 14, // paid orders confirmed before 2pm UK time on working days, subject to stock
  coldChainPacked: true, // operator-confirmed packing practice; transit temperature is not monitored
  minOrderValue: 20,
  freeDeliveryThreshold: 50,
  standardDeliveryFee: 4.99,
  // Carrier-published transit aim for the one UK service sold. An aim, not a guarantee: the copy
  // that renders it says so, and the schema emits the same window the page shows. Source read
  // 1 Nov 2026: https://www.royalmail.com/sending/uk/tracked-24 ("Next working day delivery aim").
  carrierTransitAim: {
    publishedAim: "next working day",
    minDays: 1,
    maxDays: 2,
    source: "https://www.royalmail.com/sending/uk/tracked-24",
  },
  carrier: "Royal Mail Tracked 24",
  // Payments: list only methods that are actually live at checkout.
  // Card payment uses a hosted provider page, and only while checkout is switched on.
  // Methods are listed only while that is true (see src/lib/evidence.ts).
  checkoutOpen,
  paymentMethods: (checkoutOpen ? ["Debit and credit card"] : []) as string[],
  // Enable only after enquiries notify a monitored inbox and a real reply path has been tested.
  enquiriesLive: false,
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
  // Buy two, get the third free (applied per line, every third vial free).
  b2g1: [
    { slug: "retatrutide", strength: "10mg" },
    { slug: "tirzepatide", strength: "20mg" },
  ],
  // Free gift added automatically once goods reach `over`. Fulfilled as `quantity` real £0 order
  // lines so the packer sees them; mirrored in priceBasket and quoteCheckout. Null disables it.
  firstOrderGift: {
    slug: "bacteriostatic-water",
    strength: "10ml",
    label: "5 × Bacteriostatic Water 10ml",
    short: "5× Bac Water",
    quantity: 5,
    value: 29.95,
    over: 75,
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
