# Vyrax Labs email automation

Status: code and live-branded test email verified; customer automation and guide email collection remain OFF pending access to the Vyrax Supabase project. The homepage exposes a free PDF download instead of a form until consent/unsubscribe storage is available. Do not tell customers subscriptions work yet.

## Deployment dependencies

Target Supabase project ref: `hdjpfuvbcykpbtbyxafg` (from this repository's `.env`). The available `SUPABASE_ACCESS_TOKEN` lists only UKPL, leokallio, Norwood and Sova; it cannot manage Vyrax. Do not apply this migration to a different project.

1. Gain authorized access to the Vyrax Supabase project and confirm project ref matches. Apply `supabase/migrations/20261006000000_email_outbox_automation.sql` to the intended production project, preferably using a migration runner with the project explicitly linked. This is an untested migration until actually applied; take a DB backup and inspect its trigger/cron interactions first.
2. Verify `orders.tracking_number`, `email_outbox`, `email_marketing_preferences`, two scheduled jobs and the security-definer RPCs actually exist, with no existing customer emails sent by migration (control row defaults disabled). Confirm row-level access and roles.
3. Resend domain `vyraxlabs.co.uk` verified. A dedicated Vyrax segment was created in Resend; retrieve and verify its exact ID from Resend before setting the worker secret. Send only from `Vyrax Labs <support@vyraxlabs.co.uk>`. The test send `01a113b1-067c-7ec7-b544-1d7d40d07c90` was reported delivered by Resend to the owner, not a customer.
4. Set worker secrets `VYRAX_EMAIL_FROM`, `VYRAX_GUIDE_EMAIL_FROM` to `Vyrax Labs <support@vyraxlabs.co.uk>`, `VYRAX_RESEND_SEGMENT_ID` to the verified Vyrax segment ID, `VYRAX_GUIDE_SIGNUP_ENABLED=true`, `VYRAX_EMAIL_AUTOMATION_ENABLED=true`, and a random `VYRAX_EMAIL_CRON_SECRET`. In Supabase Vault create `vyrax_email_cron_secret` with the exact same cron value. Enable `email_automation_control.enabled` only after verification. Do not print secret values.
5. Build with `VITE_SPICEPAY_CHECKOUT_ENABLED=true VITE_VYRAX_GUIDE_SIGNUP_ENABLED=true VITE_VYRAX_EMAIL_AUTOMATION_ENABLED=true bun run build` and deploy prebuilt to the existing worker. These client flags are separately required to show the opt-in and tracking UI. Never turn on client flags before DB and server switches.
6. Test with owner-owned address only: subscribe, verify segment plus DB consent, welcome email and unsubscribe; simulate paid live order in a safe test environment, verify exactly one receipt; test queued dispatch and cron delivery with actual tracking. Verify Resend provider ID in outbox. Do not fake a real order in production or claim a payment test is safe when merchant test/live credentials remain ambiguous.

## Existing safe state

The new cron endpoint requires a secret; without it POST returns 403. The guide signup endpoint returns 503 while off. The checkout webhook retains its previous direct-email path until `VYRAX_EMAIL_AUTOMATION_ENABLED=true`. The admin's tracking column and outbox enqueue are also gated until migration. The PDF can be downloaded without subscribing. Unsubscribe is a confirm-then-POST flow when enabled.

Run `bun test`, `bunx tsc --noEmit -p tsconfig.json`, `bun scripts/check-claims.mjs` and the production build after each change. Do not run repo-wide formatting.
