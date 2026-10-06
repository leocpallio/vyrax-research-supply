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
  tagline: "Research peptides dispatched from the UK",
  // Business details: fill these in before launch. Null values are shown as pending.
  legalName: "Oraxis Research Ltd" as string | null, // Vyrax Labs is a trading name of this company
  companyNumber: "17157816" as string | null, // Companies House number
  vatNumber: "GB523581496" as string | null, // VAT registered with effect from 1 September 2026
  registeredOffice: null as string | null,
  // Physical address a return can be sent to. Null means returns are handled by arrangement only;
  // src/lib/claims.ts then withholds any "returns address" line instead of printing a fake one.
  returnsAddress: null as string | null,
  email: "support@vyraxlabs.co.uk",
  phone: null as string | null, // e.g. '+44 20 7946 0000'
  whatsapp: null as string | null, // international format without +, e.g. '447700900000'
  supportHours: "Monday to Friday, 9am to 5pm (UK time)",
  // Fulfilment
  dispatchCutoffHour: 14, // same-day dispatch cut-off, UK time, working days
  freeDeliveryThreshold: 50,
  standardDeliveryFee: 4.99,
  carrier: "Royal Mail Tracked 24",
  // Payments: list only methods that are actually live at checkout.
  // Card payment is taken on SpicePay's hosted page, and only while checkout is switched on.
  // Methods are listed only while that is true (see src/lib/evidence.ts).
  checkoutOpen,
  paymentProvider: "SpicePay",
  paymentMethods: (checkoutOpen ? ["Debit and credit card"] : []) as string[],
  // Enable only after enquiries notify a monitored inbox and a real reply path has been tested.
  enquiriesLive: false,
  returnWindowDays: 14,
  // No live inventory feed yet: strength availability must be confirmed before any order.
  // Switch to 'in' only once stock levels are actually tracked.
  defaultStock: "available" as import("./types").StockState,
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
};

export const abs = (path: string) => SITE_URL + (path.startsWith("/") ? path : "/" + path);

/** Human-readable multi-buy ladder, e.g. "10% over £150, 15% over £250, 20% over £400".
 *  Any surface that restates the tiers must call this, never type the numbers. */
export const spendTierLine = () =>
  [...site.spendTiers]
    .sort((a, b) => a.over - b.over)
    .map((t) => `${Math.round(t.rate * 100)}% over £${t.over}`)
    .join(", ");
