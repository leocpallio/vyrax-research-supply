// Single source of truth for business facts shown across the site.
// Anything set to null renders as "being finalised" rather than inventing a value.
export const SITE_URL = "https://vyraxlabs.co.uk";

export const site = {
  name: "Vyrax Labs",
  url: SITE_URL,
  tagline: "Lab-tested research peptides, dispatched from the UK",
  // Business details: fill these in before launch. Null values are shown as pending.
  legalName: null as string | null, // e.g. 'Vyrax Labs Ltd'
  companyNumber: null as string | null, // Companies House number
  registeredOffice: null as string | null,
  email: null as string | null, // e.g. 'support@vyraxlabs.co.uk'
  whatsapp: null as string | null, // international format without +, e.g. '447700900000'
  supportHours: "Monday to Friday, 9am to 5pm (UK time)",
  // Fulfilment
  dispatchCutoffHour: 14, // same-day dispatch cut-off, UK time, working days
  freeDeliveryThreshold: 50,
  standardDeliveryFee: 4.99,
  carrier: "Royal Mail Tracked 24",
  // Payments: list only methods that are actually live at checkout.
  paymentMethods: [] as string[], // e.g. ['Visa', 'Mastercard', 'Apple Pay', 'Bank transfer']
  returnWindowDays: 14,
  // No live inventory feed yet: every strength shows "Available to order" unless it sets its own stock state.
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

/** Working-day, UK-time dispatch helper used by the countdown and delivery copy. */
export function dispatchInfo(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = get("weekday");
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  const workingDay = !["Sat", "Sun"].includes(day);
  const minsLeft = site.dispatchCutoffHour * 60 - (hour * 60 + minute);
  if (workingDay && minsLeft > 0) {
    return {
      today: true as const,
      minsLeft,
      label: `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`,
    };
  }
  const next = day === "Fri" || day === "Sat" ? "Monday" : day === "Sun" ? "Monday" : "tomorrow";
  return { today: false as const, minsLeft: 0, label: next };
}
