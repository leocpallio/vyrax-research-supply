-- The allowlist is keyed to auth.users.id, not a browser-supplied email or metadata.
-- Provision a verified account explicitly after applying this migration (see docs/admin-dashboard.md).
CREATE TABLE public.admin_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_members FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_members TO service_role;

-- Separate operational work from payment status: the webhook alone owns 'paid'.
ALTER TABLE public.orders ADD COLUMN workflow_status text NOT NULL DEFAULT 'unreviewed';
ALTER TABLE public.orders ADD CONSTRAINT orders_workflow_status_check CHECK (
  workflow_status IN ('unreviewed', 'reviewing', 'on_hold', 'packing', 'dispatched', 'complete')
  AND (workflow_status NOT IN ('packing', 'dispatched', 'complete')
    OR (checkout_state = 'paid' AND test_mode IS FALSE))
);
ALTER TABLE public.orders ADD CONSTRAINT orders_internal_test_check CHECK (
  status <> 'internal_test' OR (
    test_mode IS TRUE AND checkout_state IS NULL AND payment_id IS NULL
    AND total = 0 AND total_pence = 0 AND workflow_status = 'on_hold'
  )
);
-- Existing owner SELECT remains column-scoped. No new browser grants on orders.

CREATE OR REPLACE FUNCTION public.admin_order_metrics() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'total', count(*),
    'today', count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London'),
    'pending', count(*) FILTER (WHERE status = 'pending_payment'),
    'paid_live', count(*) FILTER (WHERE checkout_state = 'paid' AND test_mode IS FALSE),
    'revenue_pence', coalesce(sum(total_pence) FILTER (WHERE checkout_state = 'paid' AND test_mode IS FALSE), 0),
    'needs_attention', count(*) FILTER (WHERE workflow_status = 'unreviewed'),
    'test_orders', count(*) FILTER (WHERE test_mode IS TRUE)
  ) FROM public.orders;
$$;
REVOKE ALL ON FUNCTION public.admin_order_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_order_metrics() TO service_role;
