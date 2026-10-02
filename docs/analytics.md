# Vyrax analytics activation

No authorized Vyrax PostHog project token or capture host is configured in this repository. Tracking is **disabled** unless both build-time variables are set:

```text
VITE_POSTHOG_KEY=<Vyrax project's public project token>
VITE_POSTHOG_HOST=https://<Vyrax project's PostHog ingestion host>
```

Obtain both from the **Vyrax** PostHog project settings (use its region-specific ingestion host, e.g. `https://eu.i.posthog.com` only if that is the actual Vyrax region). Configure them in the Vyrax deployment's Vite build environment, then rebuild/redeploy. Do not copy another brand's project token. Both values are public in the browser bundle. An invalid/missing host or missing key fails closed: no consent prompt or analytics request. Review PostHog project's IP retention and data-processing settings before enabling. This implementation sets `$ip: null`, `$process_person_profile: false`, and never creates PostHog cookies; the ingestion provider still handles connection IPs transiently.

Explicit browser consent is required. Unknown and declined choices send no events. The preference is stored under `vyrax-analytics-consent`, and can be changed at `/cookies`. Revocation discards the ephemeral in-memory identifier; no SDK, replay, identify, autocapture, or persistent tracking ID is used. Each page-load session gets a different ID, so cross-session attribution is deliberately unavailable. Reloading the page does not require a new choice but does create a new anonymous ID. Events are not retroactively replayed on consent.

Events: `$pageview` (allowlisted path only, no query/fragment); `shop_viewed`; `collection_viewed` (collection or category); `product_viewed` (catalogue slug, optional strength and price); `search` (source and result count, **not** entered text); `basket_added` / `basket_removed` (persisted quantity delta); `basket_viewed`; `checkout_started` (only if the enquiry form is live and basket nonempty); `enquiry_submitted` (only after successful database insert); `enquiry_error` and `page_error` (generic stage, no error detail). The indicative total is **not** a payment. No `purchase` event exists: checkout is an enquiry and currently `site.enquiriesLive` is false, so `checkout_started` and `enquiry_submitted` cannot be emitted on the current site. No name, email, address, raw search text, form values or order ID is included. Browser requests omit referrer and credentials.

Before launch: in a Vyrax staging environment with its own PostHog token and host, verify zero requests before consent and after decline, one pageview plus route-specific event after allow, no duplicate event on hydration, correct basket quantity deltas, and no enquiry success event on failed submission. Inspect browser network payloads and the Vyrax PostHog live event stream. Do not count `enquiry_submitted` as a paid sale.
