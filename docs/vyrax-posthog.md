# Vyrax Labs PostHog implementation

Project: Vyrax Labs (EU cloud, project 291775). Token and host live in `.env.production` as
`VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`; both must belong to Vyrax. Code: `src/lib/analytics.ts`
(SDK lifecycle, trackers), `src/lib/analytics-events.ts` (pure payload builders, unit-tested),
`src/components/AnalyticsConsent.tsx` (banner + settings on /cookies).

## Privacy posture

- Nothing loads before consent. `posthog-js` is a dynamic import; the chunk is only downloaded after
  "Allow analytics". Decline = `opt_out_capturing()` + `reset(true)` + queue dropped.
- Consent stored in `localStorage["vyrax-analytics-consent"]`. No cookies (persistence: localStorage,
  `ip: false`).
- `person_profiles: identified_only`; we never call `identify()`, so visitors stay anonymous.
- `autocapture`, pageview/pageleave autocapture, heatmaps, surveys, session recording, dead clicks,
  performance capture: all off. `mask_all_text` and `maskAllInputs` on as belt and braces.
- `$referrer` / `$referring_domain` / `$initial_*` are denylisted and stripped again in
  `sanitize_properties`; `$current_url` loses its query string. Only approved paths are sent
  (guides and verify pages collapse to `/guides/:slug`, `/verify/:batch`).
- First-touch attribution: `utm_source|medium|campaign|term|content` + `landing_path` read from the
  URL once per tab, held in `sessionStorage["vyrax-first-touch"]`, sent as `$set_once`
  `initial_utm_*`. Never gclid/fbclid/referrer.

## Event list (exact names)

| Event                       | Fired from                                                              | Key properties                                                                       |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `$pageview`                 | `trackPage` via router subscribe (`__root.tsx`)                         | `$current_url` (no query), `$pathname`                                               |
| `viewed_product`            | `trackPage` on `/product/*`                                             | `product_id`, `slug`, `name`, `category`, `variant`, `price`, `currency`, `in_stock`, `is_hub` |
| `viewed_product_list`       | `trackPage` on `/shop`, `/category/*`, `/collections/*`; `trackList()`  | `list_id`, `list_type`, `item_count`, `out_of_stock_count`                           |
| `search_performed`          | header and shop search                                                  | `source`, `results` (never the query)                                                |
| `added_to_cart`             | `trackBasketChange` (catalog writeCart)                                 | product props + `slug`, `value`, `basket_quantity`, `basket_value`                   |
| `removed_from_cart`         | `trackBasketChange`                                                     | same as added_to_cart                                                                |
| `cart_viewed`               | `trackPage` on `/basket`; `CartDrawer` open                             | `item_count`, `value`, `currency`, `surface` = `page` or `drawer`                    |
| `began_checkout`            | `trackPage` on `/checkout` with items                                   | `item_count`, `value`, `currency`                                                    |
| `checkout_step`             | `PaymentCheckout` first address keystroke / submit                      | `step` = `address` or `payment`, items props                                         |
| `payment_initiated`         | `PaymentCheckout` after `/api/checkout` OK                              | `order_id`, `method` = `card`, `value`, `currency`, `item_count`, `test_mode`        |
| `order_confirmation_viewed` | `checkout_.return.tsx` when status is paid (once per order)             | `order_id`, `value`, `currency`, `test_mode`                                         |
| `back_in_stock_requested`   | `pdp/NotifyMe.tsx` after a saved request                                | `product_id`, `slug`, `strength`, `notification_type`                                |
| `page_error`                | `__root.tsx` error boundary                                             | `stage`                                                                              |
| `$set`                      | once per tab after SDK load                                             | `$set_once.initial_utm_*`, `initial_landing_path`                                    |
| `payment_confirmed`         | SERVER ONLY (`posthog.server.ts`, SpicePay webhook paid transition)     | `order_id`, `value`, `value_gbp`, `method`, `is_first_order`, `discount_used`, `$session_id`, attribution |

The checkout request also sends `ph_distinct_id` and `ph_session_id` (browser PostHog ids, max 80
chars), stored on `orders` so the server `payment_confirmed` joins the visitor and session.

Standard e-commerce item shape: `{ product_id: "<slug>|<strength>", name, category, variant, price,
currency: "GBP", quantity }`. Multi-line events add `items[]`, `item_count`, `value`.

## Funnel definitions

1. **Purchase funnel (strict order, 7 day window, unique persons):**
   `$pageview` -> `viewed_product` -> `added_to_cart` -> `cart_viewed` -> `began_checkout` ->
   `checkout_step[step=address]` -> `checkout_step[step=payment]` -> `payment_initiated` ->
   `payment_confirmed`. Breakdown by `initial_utm_source`.
2. **Browse to product:** `viewed_product_list` -> `viewed_product`, breakdown `list_id`.
3. **Search funnel:** `search_performed` -> `viewed_product` -> `added_to_cart`, breakdown `source`.
4. **Hosted payment leakage:** `payment_initiated` -> `payment_confirmed`. Filter `test_mode = false`.

## Insight setup checklist

- [ ] Project settings: disable autocapture, session replay, surveys and heatmaps at the project level
      too (defence in depth; the SDK already has them off).
- [ ] Data management: mark `payment_confirmed.value` and `value_gbp` as numeric; set `currency` as
      property of type string; define `items` as JSON.
- [ ] Actions: `Checkout address step` = `checkout_step` where `step = address`; `Checkout payment
    step` = `checkout_step` where `step = payment`.
- [ ] Funnels 1 to 4 above, saved to a "Vyrax storefront" dashboard.
- [ ] Trends: `payment_confirmed` sum of `value` by day; `added_to_cart` count by `name`;
      `viewed_product` count by `category`; `page_error` count.
- [ ] Trend: `$pageview` by `initial_utm_source` and `initial_utm_campaign` (persons mode).
- [ ] Retention is not meaningful without identify(); skip.
- [ ] Filter out `test_mode = true` events in every revenue insight.
- [ ] Alerts: `page_error` > 10/hour; `payment_confirmed` = 0 for 48h while `payment_initiated` > 0.
- [ ] Feature flags: client is ready via `onFeatureFlags(cb)` / `featureFlag(key)` in
      `src/lib/analytics.ts`; flags evaluate only after consent.

## Verification

- `bun test src/lib/analytics-events.test.ts` covers payload shapes, UTM reading and sanitising.
- In the browser: decline, confirm no `/i/v0/e/` or `/static/array.js` request; accept, confirm the
  posthog chunk loads and `$set` + `$pageview` fire; add to basket and check `added_to_cart` has
  `product_id`, `price`, `value`, `currency: "GBP"`.
