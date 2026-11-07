# Tirzepatide one-time notifications (staged, not live)

The form is specific to each Tirzepatide strength. If a strength is out of stock and its report is pending, the visitor chooses which update to request. No email is sent by this feature and requests never enter marketing preferences or Resend contacts.

## Activation gate

1. Review customer copy, privacy terms and the exact per-strength stock/report facts. Do not call an untested batch verified.
2. Apply `supabase/migrations/20261105000000_product_notifications.sql` to the Vyrax project **hdjpfuvbcykpbtbyxafg**, not the retired Sova project. Confirm the table/RPC and permissions there. The current box has no access to that project, so this migration has NOT been applied.
3. Set a secret, random `VYRAX_NOTIFY_RATE_SALT` on the server. It must remain server-only. Configure server `VYRAX_NOTIFY_ME_ENABLED=true` and build with `VITE_VYRAX_NOTIFY_ME_ENABLED=true` only after the above checks and Leo's explicit live-site approval. Both flags are off by default.
4. Run a consented test request on the live service, confirm a single row in the correct project and a throttled repeat. Verify no email is sent. Keep both flags off on any failure.

The API requires an allowed Origin, consent `true`, a valid strength and a pending report or out-of-stock state. A honeypot absorbs bots, and the database atomically caps daily attempts per salted IP digest and repeated email requests. Requests are stored by the server's service-role RPC. **Anon has no direct insert/read policy**: the brief requested insert-only anon RLS, but that would bypass the server's consent checks and rate limit. This stricter server-only design needs explicit review before activation.

A separate, Leo-approved sender must be designed and reviewed before any email. It must check unsubscribe/withdrawal and current eligibility, record `notified_at`, use a one-time idempotency key and delete or expire requests under the privacy policy. The customer can withdraw a request through the contact channel until a self-service cancellation flow is implemented. No automated retention cleanup is active in this PR.

Review evidence: `tirzepatide-notify-375.png` is a localhost-only mobile screenshot captured with a 375px viewport. The checkbox starts unchecked and the page has no horizontal overflow. The form is hidden by default in production builds.