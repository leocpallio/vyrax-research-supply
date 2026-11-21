-- Audit A2-03: abandoned checkouts and orphan 'creating' rows lingered as live pending orders.
-- Money safety: nothing here changes status or checkout_state, so apply_spicepay_event still
-- turns a late payment on an expired row into a paid order. expired_at only hides the row from
-- the "pending" counts and the admin pending list.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expired_at timestamptz;

CREATE OR REPLACE FUNCTION public.expire_stale_checkouts() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer;
BEGIN
  IF current_user <> 'postgres' AND auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  WITH gone AS (
    UPDATE public.orders SET expired_at = now()
    WHERE expired_at IS NULL AND status = 'pending_payment' AND (
      -- never reached the payment processor: no payment id exists, so nothing can be paid
      (checkout_state = 'creating' AND payment_id IS NULL AND created_at < now() - interval '1 hour')
      -- payment link abandoned for 7 days
      OR (checkout_state = 'pending' AND created_at < now() - interval '7 days')
    )
    RETURNING 1
  ) SELECT count(*) INTO v_count FROM gone;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.expire_stale_checkouts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_checkouts() TO service_role;

SELECT cron.schedule('vyrax-expire-stale-checkouts', '17 * * * *', 'SELECT public.expire_stale_checkouts()');

CREATE OR REPLACE FUNCTION public.admin_order_metrics() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'total', count(*),
    'today', count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London'),
    'pending', count(*) FILTER (WHERE status = 'pending_payment' AND expired_at IS NULL),
    'paid_live', count(*) FILTER (WHERE checkout_state = 'paid' AND test_mode IS FALSE),
    'revenue_pence', coalesce(sum(total_pence) FILTER (WHERE checkout_state = 'paid' AND test_mode IS FALSE), 0),
    'needs_attention', count(*) FILTER (WHERE workflow_status = 'unreviewed'),
    'test_orders', count(*) FILTER (WHERE test_mode IS TRUE)
  ) FROM public.orders;
$$;
