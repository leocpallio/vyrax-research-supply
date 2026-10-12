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

| Event | Fired from | Key properties |
| --- | --- | --- |
| `$pageview` | `trackPage` via router subscribe (`__root.tsx`) | `$current_url` (no query), `$pathname` |
| `product_viewed` | `trackPage` on `/product/*` | `product_id`, `name`, `category`, `variant`, `price`, `currency`, `quantity`, `value`, `product_slug`, `is_hub` |
| `product_list_viewed` | `trackPage` on `/shop`, `/category/*`, `/collections/*`; `trackList()` | `list_id`, `list_name`, `listing_type`, `item_count`, `items[]` (max 24), `currency` |
| `search` | header and shop search (SHELL/PAGES lanes) | `source`, `result_count` (never the query) |
| `basket_added` | `trackBasketChange` (catalog writeCart) | product props + `value`, `basket_quantity`, `basket_value` |
| `basket_removed` | `trackBasketChange` | same as basket_added |
| `basket_viewed` | `trackPage` on `/basket` | `items[]`, `item_count`, `value`, `currency` |
| `checkout_started` | `trackPage` on `/checkout` with items | `checkout_type`, `items[]`, `item_count`, `value`, `currency` |
| `checkout_step` | `PaymentCheckout` first address keystroke / submit | `step` = `address` or `payment`, items props |
| `hosted_payment_opened` | `PaymentCheckout` after `/api/checkout` OK | `order_id`, `value`, `currency`, `item_count`, `test_mode` |
| `payment_confirmed` | `checkout_.return.tsx` when status is paid (once per order) | `order_id`, `value`, `revenue`, `currency`, `payment_type`, `test_mode` |
| `page_error` | `__root.tsx` error boundary | `stage` |
| `collection_viewed`, `shop_viewed` | legacy aliases still emitted for existing insights | `collection_slug`, `listing_type` |
| `$set` | once after SDK load | `$set_once.initial_utm_*`, `initial_landing_path` |

Standard e-commerce item shape: `{ product_id: "<slug>|<strength>", name, category, variant, price,
currency: "GBP", quantity }`. Multi-line events add `items[]`, `item_count`, `value`.

## Funnel definitions

1. **Purchase funnel (strict order, 7 day window, unique persons):**
   `$pageview` -> `product_viewed` -> `basket_added` -> `basket_viewed` -> `checkout_started` ->
   `checkout_step[step=address]` -> `checkout_step[step=payment]` -> `hosted_payment_opened` ->
   `payment_confirmed`. Breakdown by `initial_utm_source`.
2. **Browse to product:** `product_list_viewed` -> `product_viewed`, breakdown `list_id`.
3. **Search funnel:** `search` -> `product_viewed` -> `basket_added`, breakdown `source`.
4. **Hosted payment leakage:** `hosted_payment_opened` -> `payment_confirmed`. Filter `test_mode = false`.

## Insight setup checklist

- [ ] Project settings: disable autocapture, session replay, surveys and heatmaps at the project level
      too (defence in depth; the SDK already has them off).
- [ ] Data management: mark `payment_confirmed.value` and `revenue` as numeric; set `currency` as
      property of type string; define `items` as JSON.
- [ ] Actions: `Checkout address step` = `checkout_step` where `step = address`; `Checkout payment
      step` = `checkout_step` where `step = payment`.
- [ ] Funnels 1 to 4 above, saved to a "Vyrax storefront" dashboard.
- [ ] Trends: `payment_confirmed` sum of `revenue` by day; `basket_added` count by `name`;
      `product_viewed` count by `category`; `page_error` count.
- [ ] Trend: `$pageview` by `initial_utm_source` and `initial_utm_campaign` (persons mode).
- [ ] Retention is not meaningful without identify(); skip.
- [ ] Filter out `test_mode = true` events in every revenue insight.
- [ ] Alerts: `page_error` > 10/hour; `payment_confirmed` = 0 for 48h while `hosted_payment_opened` > 0.
- [ ] Feature flags: client is ready via `onFeatureFlags(cb)` / `featureFlag(key)` in
      `src/lib/analytics.ts`; flags evaluate only after consent.

## Verification

- `bun test src/lib/analytics-events.test.ts` covers payload shapes, UTM reading and sanitising.
- In the browser: decline, confirm no `/i/v0/e/` or `/static/array.js` request; accept, confirm the
  posthog chunk loads and `$set` + `$pageview` fire; add to basket and check `basket_added` has
  `product_id`, `price`, `value`, `currency: "GBP"`.
