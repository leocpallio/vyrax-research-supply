-- Checkout is service-role only. Existing enquiry rows are retained, but browsers can no longer write orders.
DROP POLICY IF EXISTS "Guests create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers create own orders" ON public.orders;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE SELECT ON public.orders FROM anon;
-- Preserve account history while withholding guest tokens, addresses and payment metadata.
-- Column-level grants prevent SELECT * even for the owner.
REVOKE SELECT ON public.orders FROM authenticated;
GRANT SELECT (id, user_id, created_at, total, status) ON public.orders TO authenticated;
-- Keep the existing "Customers see own orders" policy (user_id = auth.uid()).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS total_pence integer,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS merchant_id text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS test_mode boolean,
  ADD COLUMN IF NOT EXISTS checkout_state text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_spicepay_payment_id_unique ON public.orders(payment_id) WHERE payment_id IS NOT NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_spicepay_valid CHECK (
  checkout_state IS NULL OR (
    checkout_state IN ('creating', 'pending', 'paid') AND total_pence BETWEEN 1 AND 100000000
    AND currency = 'GBP' AND merchant_id IS NOT NULL AND test_mode IS NOT NULL
    AND (checkout_state = 'creating' OR payment_id IS NOT NULL)
  )
);

CREATE TABLE public.spicepay_events (
  event_id text PRIMARY KEY,
  payment_id text NOT NULL,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.spicepay_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.spicepay_events TO service_role;
ALTER TABLE public.spicepay_events ENABLE ROW LEVEL SECURITY;

-- Single transaction: lock target, re-check payment invariants, dedupe event, then conditionally pay.
-- Neither webhook deliveries nor return URLs can write paid status outside this service-role RPC.
CREATE OR REPLACE FUNCTION public.apply_spicepay_event(
  p_event_id text, p_event_type text, p_payment_id text, p_merchant_id text,
  p_amount integer, p_currency text, p_test_mode boolean, p_status text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE payment_id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment'; END IF;
  IF v_order.merchant_id IS DISTINCT FROM p_merchant_id OR v_order.total_pence IS DISTINCT FROM p_amount
    OR v_order.currency IS DISTINCT FROM p_currency OR v_order.test_mode IS DISTINCT FROM p_test_mode
    OR v_order.checkout_state NOT IN ('pending', 'paid') THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
  IF p_event_type = 'payment_succeeded' AND p_status <> 'succeeded' THEN RAISE EXCEPTION 'Status mismatch'; END IF;
  INSERT INTO public.spicepay_events(event_id, payment_id, event_type)
    VALUES (p_event_id, p_payment_id, p_event_type) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
  IF p_event_type = 'payment_succeeded' AND v_order.checkout_state = 'pending' THEN
    UPDATE public.orders SET checkout_state = 'paid', status = 'paid'
      WHERE id = v_order.id AND checkout_state = 'pending';
    RETURN 'paid';
  END IF;
  RETURN 'ignored';
END $$;
REVOKE ALL ON FUNCTION public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text) TO service_role;
