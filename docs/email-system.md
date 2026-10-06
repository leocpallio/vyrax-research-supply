# Vyrax Labs email system

Transactional email uses Resend REST from the server only.

- Templates: `src/lib/email/templates.ts` (order confirmation after payment, payment failed, payment expired, dispatch). Each renders HTML (escaped, inline CSS, 600px, dark-mode media query) and plain text, with order reference (`VX-xxxxxxxx`), support address, research-use notice. Carrier is named as Royal Mail Tracked 24; no delivery date is promised.
- Transport: `src/lib/email/send.server.ts`. Needs `RESEND_API_KEY` and `VYRAX_EMAIL_FROM` (a sender on vyraxlabs.co.uk; malformed or header-injecting senders are rejected). Idempotency-Key header per message.
- Wiring: `src/lib/email/order-email.server.ts` `sendOrderEmail` is called from `spicepayWebhook` after the signed event is applied. Confirmation is sent only when the RPC returns `paid` (so webhook retries do not resend). It is skipped when `RESEND_API_KEY` is unset, and any failure is logged and swallowed: the order stays paid.
- Not wired: dispatch email has a template but no caller, because the admin workflow change has no tracking number or send hook yet. Failed/expired mails depend on SpicePay event names matching /fail|declin/ or /expir/ and on the order still being pending; unverified against live events.
- Not proven: DNS, sender verification, delivery, and the support mailbox. Rotate any previously exposed key. Never use another brand's key.

Run `bun test`, `bunx tsc --noEmit`, `bun run claims`, `bun run build`.
