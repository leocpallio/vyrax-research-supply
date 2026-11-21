-- Correct only verified terminal states. Leave old rows untouched and allow a late signed success.
ALTER TABLE public.orders DROP CONSTRAINT orders_spicepay_valid;
ALTER TABLE public.orders ADD CONSTRAINT orders_spicepay_valid CHECK (
  checkout_state IS NULL OR (
    checkout_state IN ('creating', 'pending', 'failed', 'expired', 'paid')
    AND total_pence BETWEEN 1 AND 100000000
    AND currency = 'GBP' AND merchant_id IS NOT NULL AND test_mode IS NOT NULL
    AND (checkout_state IN ('creating', 'failed') OR payment_id IS NOT NULL)
  )
);

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
    OR v_order.checkout_state NOT IN ('pending', 'expired', 'paid') THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
  IF p_event_type = 'payment_succeeded' AND p_status IS DISTINCT FROM 'succeeded' THEN RAISE EXCEPTION 'Status mismatch'; END IF;
  IF p_event_type = 'payment_expired' AND p_status IS DISTINCT FROM 'expired' THEN RAISE EXCEPTION 'Status mismatch'; END IF;
  INSERT INTO public.spicepay_events(event_id, payment_id, event_type)
    VALUES (p_event_id, p_payment_id, p_event_type) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
  IF p_event_type = 'payment_succeeded' AND v_order.checkout_state IN ('pending', 'expired') THEN
    UPDATE public.orders SET checkout_state = 'paid', status = 'paid', expired_at = NULL
      WHERE id = v_order.id AND checkout_state IN ('pending', 'expired');
    RETURN 'paid';
  END IF;
  IF p_event_type = 'payment_expired' AND v_order.checkout_state = 'pending' THEN
    UPDATE public.orders SET checkout_state = 'expired', expired_at = now()
      WHERE id = v_order.id AND checkout_state = 'pending';
    RETURN 'expired';
  END IF;
  RETURN 'ignored';
END $$;
REVOKE ALL ON FUNCTION public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text) TO service_role;
