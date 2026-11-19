-- Dispatched-email robustness (audit A3-04 and A3-07).
-- A3-07: the shipped trigger copied NEW.tracking_number at the moment workflow_status became 'dispatched',
--        so an empty tracking number was frozen into the outbox row (ON CONFLICT DO NOTHING kept it forever).
-- A3-04: the trigger did not watch tracking_number, so tracking written AFTER dispatch (or without a
--        dispatched transition) never produced a shipped email.
-- Rules after this migration:
--   1. A 'dispatched' email is never created, queued or claimed for an order whose tracking number is empty.
--   2. Dispatch with empty tracking creates no outbox row; filling tracking later (order still 'dispatched')
--      queues exactly one row. A row cancelled or still queued with empty tracking is re-queued once with the
--      real number. A processing, sent or failed row is never touched, so nothing sends twice.
--   3. Tracking alone on an order that is not dispatched queues nothing.
-- No sends are enabled by this migration (email_automation_control stays as it is). Existing orders are not
-- touched: triggers fire on future updates only.

CREATE FUNCTION public.email_tracking_present(p_tracking text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT nullif(btrim(p_tracking), '') IS NOT NULL;
$$;

-- Same predicate as the current definition (20261117000000 gap flows: suppression list, frequency cap, packed and
-- feedback cases), plus: a 'dispatched' email needs a tracking number on the order.
CREATE OR REPLACE FUNCTION public.email_job_eligible(p_kind text, p_order public.orders) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ((p_order).test_mode IS FALSE)
    AND (p_order).status <> 'internal_test'
    AND (p_order).email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND lower((p_order).email) NOT IN ('test@gmail.com','leo.k.kallio@gmail.com')
    AND lower((p_order).email) !~ '@(example\.(com|org|net)|test\.[a-z]+)$'
    AND NOT EXISTS (SELECT 1 FROM public.email_delivery_suppression s
      WHERE s.email = lower(btrim((p_order).email)))
    AND CASE p_kind
      WHEN 'orderConfirmation' THEN (p_order).checkout_state = 'paid' AND (p_order).created_at > now() - interval '14 days'
      WHEN 'dispatched' THEN (p_order).checkout_state = 'paid' AND (p_order).workflow_status IN ('dispatched','complete')
        AND public.email_tracking_present((p_order).tracking_number) AND (p_order).created_at > now() - interval '90 days'
      WHEN 'paymentFailed' THEN (p_order).checkout_state = 'pending' AND (p_order).created_at > now() - interval '48 hours'
      WHEN 'paymentExpired' THEN (p_order).checkout_state = 'pending' AND (p_order).created_at > now() - interval '48 hours'
      WHEN 'pendingPayment' THEN (p_order).checkout_state = 'pending' AND (p_order).created_at BETWEEN now() - interval '24 hours' AND now() - interval '1 hour'
      WHEN 'postPurchase' THEN (p_order).checkout_state = 'paid' AND (p_order).created_at BETWEEN now() - interval '14 days' AND now() - interval '3 days'
      WHEN 'reorder' THEN (p_order).checkout_state = 'paid' AND (p_order).created_at BETWEEN now() - interval '45 days' AND now() - interval '30 days'
        AND NOT EXISTS (SELECT 1 FROM public.orders newer WHERE lower(btrim(newer.email)) = lower(btrim((p_order).email))
          AND newer.id <> (p_order).id AND newer.created_at > (p_order).created_at AND newer.checkout_state = 'paid' AND newer.test_mode IS FALSE)
      WHEN 'packed' THEN (p_order).checkout_state = 'paid' AND (p_order).workflow_status = 'packing'
        AND (p_order).created_at > now() - interval '14 days'
      WHEN 'feedback' THEN (p_order).checkout_state = 'paid' AND (p_order).workflow_status IN ('dispatched','complete')
        AND (p_order).created_at > now() - interval '60 days'
        AND EXISTS (SELECT 1 FROM public.email_outbox d WHERE d.order_id = (p_order).id AND d.kind = 'dispatched'
          AND d.status = 'sent' AND d.sent_at BETWEEN now() - interval '13 days' AND now() - interval '10 days')
      ELSE false
    END
    AND (p_kind NOT IN ('pendingPayment','postPurchase','reorder','feedback') OR EXISTS (
      SELECT 1 FROM public.email_marketing_preferences pref WHERE pref.email = lower(btrim((p_order).email))
        AND pref.unsubscribed_at IS NULL AND pref.consented_at <= now()
    ))
    AND (p_kind NOT IN ('pendingPayment','postPurchase','reorder','feedback') OR NOT EXISTS (
      SELECT 1 FROM public.email_outbox j JOIN public.orders prior ON prior.id = j.order_id
      WHERE lower(btrim(prior.email)) = lower(btrim((p_order).email))
        AND j.kind IN ('pendingPayment','postPurchase','reorder','feedback')
        AND j.status = 'sent' AND j.sent_at > now() - interval '7 days'
    ));
$$;
REVOKE ALL ON FUNCTION public.email_tracking_present(text), public.email_job_eligible(text,public.orders) FROM PUBLIC, anon, authenticated;

-- Service-role enqueue (admin retry path): a dispatched email never carries empty tracking. The eligibility
-- check above already returns NULL for empty tracking; the upsert also repairs a legacy frozen-empty row.
CREATE OR REPLACE FUNCTION public.enqueue_order_email(p_order_id uuid,p_kind text,p_event_key text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order public.orders%ROWTYPE; v_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF length(p_event_key) NOT BETWEEN 1 AND 200 OR p_kind NOT IN
    ('orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder','packed','feedback')
    THEN RAISE EXCEPTION 'Invalid email event'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown order'; END IF;
  IF NOT public.email_job_eligible(p_kind,v_order) THEN RETURN NULL; END IF;
  INSERT INTO public.email_outbox(order_id,kind,event_key,tracking_number)
    VALUES (p_order_id,p_kind,p_event_key,CASE WHEN p_kind = 'dispatched' THEN btrim(v_order.tracking_number) ELSE NULL END)
    ON CONFLICT (order_id,kind) DO UPDATE SET tracking_number = EXCLUDED.tracking_number, status = 'queued',
      attempts = 0, available_at = now(), created_at = now(), claim_token = NULL, lease_until = NULL, last_error = NULL
      WHERE public.email_outbox.kind = 'dispatched' AND public.email_outbox.status IN ('queued','cancelled')
        AND NOT public.email_tracking_present(public.email_outbox.tracking_number)
    RETURNING id INTO v_id;
  IF v_id IS NULL THEN SELECT id INTO v_id FROM public.email_outbox WHERE order_id = p_order_id AND kind = p_kind; END IF;
  RETURN v_id;
END $$;

-- Trigger: confirmation as before; dispatched only with a real tracking number, on the dispatch transition
-- OR when tracking is filled in while the order is already dispatched.
CREATE OR REPLACE FUNCTION public.enqueue_order_transition_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.checkout_state = 'paid' AND OLD.checkout_state IS DISTINCT FROM 'paid' AND NEW.test_mode IS FALSE THEN
    INSERT INTO public.email_outbox(order_id,kind,event_key) VALUES (NEW.id,'orderConfirmation','paid')
      ON CONFLICT (order_id,kind) DO NOTHING;
  END IF;
  IF NEW.workflow_status = 'dispatched' AND NEW.checkout_state = 'paid' AND NEW.test_mode IS FALSE
    AND public.email_tracking_present(NEW.tracking_number)
    AND (OLD.workflow_status IS DISTINCT FROM 'dispatched' OR NOT public.email_tracking_present(OLD.tracking_number)) THEN
    INSERT INTO public.email_outbox(order_id,kind,event_key,tracking_number)
      VALUES (NEW.id,'dispatched','dispatched',btrim(NEW.tracking_number))
      ON CONFLICT (order_id,kind) DO UPDATE SET tracking_number = EXCLUDED.tracking_number, status = 'queued',
        attempts = 0, available_at = now(), created_at = now(), claim_token = NULL, lease_until = NULL, last_error = NULL
        WHERE public.email_outbox.status IN ('queued','cancelled')
          AND NOT public.email_tracking_present(public.email_outbox.tracking_number);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER orders_email_transitions ON public.orders;
CREATE TRIGGER orders_email_transitions AFTER UPDATE OF checkout_state,workflow_status,tracking_number ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_transition_email();
REVOKE ALL ON FUNCTION public.enqueue_order_transition_email() FROM PUBLIC, anon, authenticated, service_role;

-- Cancel any unsent dispatched row that already froze an empty tracking number (claim would cancel it anyway
-- because the order is now ineligible). Rows already sent or failed are history and are left alone.
UPDATE public.email_outbox SET status = 'cancelled', claim_token = NULL, lease_until = NULL
  WHERE kind = 'dispatched' AND status = 'queued' AND NOT public.email_tracking_present(tracking_number);

-- Belt and braces: the table itself refuses a live (queued/processing) dispatched row with empty tracking.
-- NOT VALID so legacy history is not rewritten; every new insert and update is checked.
ALTER TABLE public.email_outbox ADD CONSTRAINT email_outbox_dispatched_needs_tracking
  CHECK (kind <> 'dispatched' OR status IN ('sent','failed','cancelled') OR public.email_tracking_present(tracking_number)) NOT VALID;
