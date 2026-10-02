# Vyrax operations dashboard

`/admin` is a client-side sign-in surface. `GET/PATCH /api/admin/orders` revalidates the bearer token with Supabase Auth on **every request**, then looks up that exact `auth.users.id` in `public.admin_members` through the server-only service role. The verified auth email must still be `leo.k.kallio@gmail.com`. User metadata, a query-string email, a locally decoded JWT, and a matching email without a DB membership do not confer access. The service key must be configured only on the SSR runtime; never use a `VITE_` variable for it. Responses are private/no-store and the page is noindex. No order PII is SSR-rendered.

## Before use

1. Apply the existing `20261002000000_spicepay_checkout.sql` migration, then `20261002010000_admin_dashboard.sql` to the **Vyrax** Supabase project. Do not apply the latter alone: the workflow constraint refers to `checkout_state` and `test_mode`. Check RLS and grants. The new table has RLS enabled, no anon/authenticated grants, and no browser-readable policy. Owner order history retains its narrow SELECT grant; admin access goes only through the server route. `admin_order_metrics()` is service-role-only.
2. Create/sign into Leo's Supabase Auth account via `/admin` (or `/account`), verify the email through the provider and verify the exact user ID and email in Auth. Once the owner has confirmed which account is theirs, a DB operator can provision it using a privileged SQL session:

   ```sql
   SELECT id, email, email_confirmed_at FROM auth.users
   WHERE lower(email) = 'leo.k.kallio@gmail.com';
   -- Confirm the returned ID belongs to Leo before proceeding. The query must return one verified account.
   INSERT INTO public.admin_members(user_id, active)
   VALUES ('<confirmed-auth-user-uuid>', true)
   ON CONFLICT (user_id) DO UPDATE SET active = true;
   ```

   **Do not seed the email alone in a migration**, set role metadata from a client, or automatically grant access to whoever registers that string. Revoke by setting `active=false` or deleting the membership. A changed/unconfirmed email also immediately fails the server check.
3. Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` on the SSR server. The publishable key may be public; the service role must never be in a browser build, `.env.production`, logging or a `VITE_` variable. Use a service-role JWT that is accepted by the Vyrax PostgREST endpoint; do not assume a new `sb_secret_` key works as a Bearer JWT. Deploy only after the migrations, identity verification and membership are confirmed.
4. With real accounts test anon, a verified nonmember, an unverified member, and the verified allowlisted user. Assert 403 for the former cases on list/detail/overview/PATCH, and that account-history SELECT cannot read guest tokens, addresses or payment IDs. Exercise status filters/pagination, old enquiries, test orders, and DB constraint rejection of packing/dispatch for unpaid or test orders. Check response headers and that no key appears in public assets. No credentials or migrations have been applied by this commit.

## Metrics and workflow

Overview counts all stored orders (including enquiries and test records); paid live revenue sums `total_pence` only where webhook-owned `checkout_state='paid'` and `test_mode=false`. It is **gross payments, not net revenue**: no refunds, fees, tax, returns or fulfilment accounting exists in this schema. Today uses London midnight. The editable `workflow_status` is separate from payment `status` and `checkout_state`. Packing/dispatch/complete require a paid live order enforced by a database CHECK; a dashboard operator cannot mark an order paid. Search accepts an exact email or UUID; list results are paginated at 25, newest first. No fabricated customer order rows or numbers are shown.

The dashboard's £0 internal test item creates a marked `internal_test` row with `test_mode=true`, `checkout_state=NULL`, `payment_id=NULL` and an explicit never-ship address. A database CHECK locks it at `on_hold` and zero amount; it is excluded from paid live revenue. This exercises authenticated admin insert, retrieval, metrics and filtering after migration. It is NOT a public catalogue SKU and does not exercise hosted SpicePay, signed webhooks, receipt email, shipping or a real order. The payment route and checkout constraint require at least 1p, and a processor may enforce a higher minimum. Real payment E2E requires a separate, processor-accepted nonzero sandbox amount with verified sandbox credentials; `test_mode=true` alone is not proof that funds cannot move.
