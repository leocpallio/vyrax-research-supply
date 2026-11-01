import { site } from "../data/site";

/** Static cut-off wording; avoid a countdown that implies weekend/bank-holiday dispatch. */
export function dispatchCutoffLabel(): string {
  const hour = site.dispatchCutoffHour;
  if (hour < 1 || hour > 23 || !Number.isInteger(hour)) throw new Error("Invalid dispatch cutoff");
  return hour > 12 ? `${hour - 12}pm UK time` : hour === 12 ? "12pm UK time" : `${hour}am UK time`;
}

/** The time window this site states, in one place: copy and schema both read it, so a page can
 *  never describe a delivery time the visible page does not show. Handling time is 0-1 working days
 *  (same-day dispatch before the cut-off, else the next working day); transit is the carrier's
 *  published aim plus one working day of allowance, not a guarantee. */
export const DELIVERY_WINDOW = {
  handlingMin: 0,
  handlingMax: 1,
  transitMin: site.carrierTransitAim.minDays,
  transitMax: site.carrierTransitAim.maxDays,
} as const;

/** Values for the `delivery.transit-aim` claim. */
export const transitAimValues = () => ({
  courier: site.carrier,
  aim: site.carrierTransitAim.publishedAim,
  window: `${site.carrierTransitAim.minDays} to ${site.carrierTransitAim.maxDays} working days`,
});

/** Schema.org DayOfWeek list for the working days the carrier moves parcels. */
const BUSINESS_DAYS = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
];

/** OfferShippingDetails.deliveryTime. Same numbers as DELIVERY_WINDOW, same wording on the page. */
export function deliveryTimeJsonLd(): Record<string, unknown> {
  return {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: DELIVERY_WINDOW.handlingMin,
      maxValue: DELIVERY_WINDOW.handlingMax,
      unitCode: "DAY",
      businessDays: BUSINESS_DAYS,
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: DELIVERY_WINDOW.transitMin,
      maxValue: DELIVERY_WINDOW.transitMax,
      unitCode: "DAY",
      businessDays: BUSINESS_DAYS,
    },
  };
}

/** Where the transit aim came from, for the shipping page footnote. */
export const transitAimSource = () => site.carrierTransitAim.source;
