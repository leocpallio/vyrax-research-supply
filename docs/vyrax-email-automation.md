# Vyrax Labs email automation

Status: customer automation and guide email collection remain OFF. The outbox additionally requires `VYRAX_EMAIL_PROVIDER_APPROVED=true` before it claims work. This deployment gate is not evidence that Resend accepts Vyrax's product category. The homepage exposes a free PDF download instead of a form until consent/unsubscribe storage is available.

## Event map and suppression contract

| Trigger | Wait | Send-time filter | Action / exit |
| --- | --- | --- | --- |
| Paid order transition | Immediate | Live paid order, non-test | One confirmation; exit on sent/cancelled |
| Dispatch transition | Immediate | Live paid and dispatched | One service update; exit on sent/cancelled |
| Failed or expired payment | Webhook | Live pending order | One status message; exit when ineligible |
| Pending payment | 1 hour | Pending, opted in, not unsubscribed | One recovery; exit on paid/opt-out |
| Post-purchase | 3 days | Paid, opted in, not unsubscribed | One follow-up; exit on opt-out |
| Reorder | 30 days | Paid, no later paid order, opted in | One follow-up; exit on purchase/opt-out |

SQL limits each order and kind to one row and rechecks eligibility at enqueue, claim and send. Resend suppression is checked separately for marketing. Failed claims retry under a lease with bounded attempts and a stable provider idempotency key. A provider accepting a message without returning its ID can still produce an uncertain outcome. The guide signup route is separate and must stay disabled pending an approved consumer sender. Maildoso corporate-only SMTP is not an approved consumer adapter. Corporate list imports and outreach sequences are out of scope.
Marketing rows additionally require no marketing send to that address in the previous seven days; a skipped action is not automatically rescheduled. A service-role-only bounce/complaint suppression table applies to all outbox kinds, but there is no trusted provider webhook feeding it yet. Provider suppression sync is a launch blocker. Cart abandonment has no verified event source and therefore has no trigger; checkout recovery uses the real pending order only. Welcome after opt-in is owned by the separate guide signup flow and is not synthesized from historical contact imports.

Before setting `VYRAX_EMAIL_PROVIDER_APPROVED`, independently verify written category permission, sender DNS and receipt, suppression parity, unsubscribe, legal copy, migration and owner-owned test delivery. If any check fails, leave it unset. Revert by removing this flag and setting `email_automation_control.enabled=false`.

## Deployment dependencies

Target Supabase project ref: `hdjpfuvbcykpbtbyxafg` (from this repository's `.env`). The available `SUPABASE_ACCESS_TOKEN` lists only UKPL, leokallio, Norwood and Sova; it cannot manage Vyrax. Do not apply this migration to a different project.

1. Gain authorized access to the Vyrax Supabase project and confirm project ref matches. Apply `supabase/migrations/20261006000000_email_outbox_automation.sql` to the intended production project, preferably using a migration runner with the project explicitly linked. This is an untested migration until actually applied; take a DB backup and inspect its trigger/cron interactions first.
2. Verify `orders.tracking_number`, `email_outbox`, `email_marketing_preferences`, two scheduled jobs and the security-definer RPCs actually exist, with no existing customer emails sent by migration (control row defaults disabled). Confirm row-level access and roles.
3. Resend domain `vyraxlabs.co.uk` verified. A dedicated Vyrax segment was created in Resend; retrieve and verify its exact ID from Resend before setting the worker secret. Send only from `Vyrax Labs <support@vyraxlabs.co.uk>`. The test send `01a113b1-067c-7ec7-b544-1d7d40d07c90` was reported delivered by Resend to the owner, not a customer.
4. Only after provider approval, set worker secrets `VYRAX_EMAIL_FROM`, `VYRAX_GUIDE_EMAIL_FROM` to `Vyrax Labs <support@vyraxlabs.co.uk>`, `VYRAX_RESEND_SEGMENT_ID` to the verified Vyrax segment ID, `VYRAX_GUIDE_SIGNUP_ENABLED=true`, `VYRAX_EMAIL_AUTOMATION_ENABLED=true`, `VYRAX_EMAIL_PROVIDER_APPROVED=true`, and a random `VYRAX_EMAIL_CRON_SECRET`. In Supabase Vault create `vyrax_email_cron_secret` with the exact same cron value. Enable `email_automation_control.enabled` only after verification. Do not print secret values.
5. Build with `VITE_SPICEPAY_CHECKOUT_ENABLED=true VITE_VYRAX_GUIDE_SIGNUP_ENABLED=true VITE_VYRAX_EMAIL_AUTOMATION_ENABLED=true bun run build` and deploy prebuilt to the existing worker. These client flags are separately required to show the opt-in and tracking UI. Never turn on client flags before DB and server switches.
6. Test with owner-owned address only: subscribe, verify segment plus DB consent, welcome email and unsubscribe; simulate paid live order in a safe test environment, verify exactly one receipt; test queued dispatch and cron delivery with actual tracking. Verify Resend provider ID in outbox. Do not fake a real order in production or claim a payment test is safe when merchant test/live credentials remain ambiguous.

## Existing safe state

The new cron endpoint requires a secret; without it POST returns 403. The guide signup endpoint returns 503 while off. The checkout webhook retains its previous direct-email path until `VYRAX_EMAIL_AUTOMATION_ENABLED=true`. The admin's tracking column and outbox enqueue are also gated until migration. The PDF can be downloaded without subscribing. Unsubscribe is a confirm-then-POST flow when enabled.

Run `bun test`, `bunx tsc --noEmit -p tsconfig.json`, `bun scripts/check-claims.mjs` and the production build after each change. Do not run repo-wide formatting.
