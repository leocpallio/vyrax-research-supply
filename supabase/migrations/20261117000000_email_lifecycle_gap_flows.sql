-- Vyrax lifecycle gap flows: packed (transactional), feedback request (day 10 after dispatch) and win-back (day 60).
-- Staged, sender off. Additive: existing flows keep their behaviour.
--   * Nothing here enables a send. Delivery is still gated by email_automation_control (default off), the app flags
--     VYRAX_EMAIL_AUTOMATION_ENABLED + VYRAX_EMAIL_PROVIDER_APPROVED, and one flag per new flow
--     (VYRAX_PACKED_ENABLED, VYRAX_FEEDBACK_ENABLED, VYRAX_WINBACK_ENABLED), all unset.
--   * The new kinds are only claimed when the app passes them in p_kinds, so a flag that is off leaves the row queued
--     (and cancelled after 48 hours by the existing claim sweep), never sent.
--   * Existing cron jobs and schedules are untouched: the enqueue functions are wrapped, not rescheduled.
--   * No unsubscribe surface is added. Marketing kinds (feedback, winback) use the existing consent table, the Resend
--     subscription check, the 7 day cross-flow cap and the suppression table.

-- 1. CHECK constraints (REGISTER row 10: 'packed' was missing).
ALTER TABLE public.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_kind_check;
ALTER TABLE public.email_outbox ADD CONSTRAINT email_outbox_kind_check CHECK (kind IN
  ('orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder','packed','feedback'));
ALTER TABLE public.email_contact_outbox DROP CONSTRAINT IF EXISTS email_contact_outbox_kind_check;
ALTER TABLE public.email_contact_outbox ADD CONSTRAINT email_contact_outbox_kind_check CHECK (kind IN
  ('welcomeD1','welcomeD2','welcomeD3','cart1','cart2','backInStock','winback'));

-- 2. Eligibility, one predicate used at enqueue, claim and recheck.
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
      WHEN 'dispatched' THEN (p_order).checkout_state = 'paid' AND (p_order).workflow_status IN ('dispatched','complete') AND (p_order).created_at > now() - interval '90 days'
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
    VALUES (p_order_id,p_kind,p_event_key,CASE WHEN p_kind = 'dispatched' THEN v_order.tracking_number ELSE NULL END)
    ON CONFLICT (order_id,kind) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN SELECT id INTO v_id FROM public.email_outbox WHERE order_id = p_order_id AND kind = p_kind; END IF;
  RETURN v_id;
END $$;

-- 3. Claim with an optional kind filter. The old one-argument signatures are dropped so there is one entry point each.
DROP FUNCTION IF EXISTS public.claim_email_outbox(integer);
CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit integer DEFAULT 20, p_kinds text[] DEFAULT NULL)
RETURNS TABLE(id uuid, order_id uuid, kind text, claim_token uuid, email text, name text,
              address text,address2 text,city text,postcode text,created_at timestamptz,items jsonb,
              total_pence integer, tracking_number text, unsubscribe_token uuid, merchant_id text, payment_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_limit NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Invalid batch size'; END IF;
  -- Terminalise stale/over-attempted entries; do not keep unbounded retries or send old reminders.
  UPDATE public.email_outbox j SET status = 'cancelled',claim_token = NULL,lease_until = NULL
    FROM public.orders o WHERE j.order_id = o.id AND j.status IN ('queued','processing')
    AND j.kind = ANY (coalesce(p_kinds, ARRAY['orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder']))
    AND (j.attempts >= 8 OR j.created_at < now() - interval '48 hours'
      OR (j.status = 'queued' AND NOT public.email_job_eligible(j.kind,o))
      OR (j.status = 'processing' AND j.lease_until < now() AND NOT public.email_job_eligible(j.kind,o)));
  RETURN QUERY
    WITH picked AS (SELECT j.id FROM public.email_outbox j
      WHERE ((j.status = 'queued' AND j.available_at <= now())
        OR (j.status = 'processing' AND j.lease_until < now()))
        AND j.kind = ANY (coalesce(p_kinds, ARRAY['orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder']))
      ORDER BY j.available_at,j.id FOR UPDATE SKIP LOCKED LIMIT p_limit),
    claimed AS (UPDATE public.email_outbox j SET status = 'processing', attempts = j.attempts + 1,
        lease_until = now() + interval '5 minutes', claim_token = gen_random_uuid()
      FROM picked p, public.orders o WHERE j.id = p.id AND o.id = j.order_id
        AND j.attempts < 8 AND public.email_job_eligible(j.kind,o)
      RETURNING j.id,j.order_id,j.kind,j.claim_token,j.tracking_number)
    SELECT c.id,c.order_id,c.kind,c.claim_token,o.email,o.name,o.address,o.address2,o.city,o.postcode,o.created_at,o.items,o.total_pence,c.tracking_number,
      pref.unsubscribe_token,o.merchant_id,o.payment_id FROM claimed c JOIN public.orders o ON o.id = c.order_id
      LEFT JOIN public.email_marketing_preferences pref ON pref.email = lower(btrim(o.email))
        AND c.kind IN ('pendingPayment','postPurchase','reorder','feedback');
END $$;
DROP FUNCTION IF EXISTS public.claim_contact_outbox(integer);
CREATE OR REPLACE FUNCTION public.claim_contact_outbox(p_limit integer DEFAULT 20, p_kinds text[] DEFAULT NULL)
RETURNS TABLE(id uuid,email text,kind text,event_key text,payload jsonb,claim_token uuid,unsubscribe_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_contact_outbox j SET status = 'cancelled', claim_token = NULL, lease_until = NULL
    WHERE j.status IN ('queued','processing') AND (j.lease_until IS NULL OR j.lease_until < now())
      AND j.kind = ANY (coalesce(p_kinds, ARRAY['welcomeD1','welcomeD2','welcomeD3','cart1','cart2','backInStock']))
      AND (NOT public.email_contact_job_eligible(j.email,j.kind,j.event_key) OR j.created_at < now() - interval '48 hours');
  RETURN QUERY
    WITH picked AS (SELECT j.id FROM public.email_contact_outbox j
      WHERE ((j.status = 'queued' AND j.available_at <= now()) OR (j.status = 'processing' AND j.lease_until < now()))
        AND j.kind = ANY (coalesce(p_kinds, ARRAY['welcomeD1','welcomeD2','welcomeD3','cart1','cart2','backInStock']))
      ORDER BY j.available_at, j.id FOR UPDATE SKIP LOCKED LIMIT p_limit),
    claimed AS (UPDATE public.email_contact_outbox j SET status = 'processing', attempts = j.attempts + 1,
        lease_until = now() + interval '5 minutes', claim_token = gen_random_uuid()
      FROM picked p WHERE j.id = p.id AND j.attempts < 8
      RETURNING j.id,j.email,j.kind,j.event_key,j.payload,j.claim_token)
    SELECT c.id,c.email,c.kind,c.event_key,c.payload,c.claim_token,pref.unsubscribe_token
      FROM claimed c JOIN public.email_marketing_preferences pref ON pref.email = c.email;
END $$;

CREATE OR REPLACE FUNCTION public.email_contact_job_eligible(p_email text, p_kind text, p_event_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.email_contact_ok(p_email) AND CASE
    WHEN p_kind = 'winback' THEN p_event_key = 'once'
      AND NOT EXISTS (SELECT 1 FROM public.email_delivery_suppression s WHERE s.email = lower(btrim(p_email)))
      AND EXISTS (SELECT 1 FROM public.orders o WHERE lower(btrim(o.email)) = lower(btrim(p_email))
          AND o.checkout_state = 'paid' AND o.test_mode IS FALSE AND o.status <> 'internal_test'
          AND o.created_at BETWEEN now() - interval '63 days' AND now() - interval '60 days'
          AND NOT EXISTS (SELECT 1 FROM public.orders newer WHERE lower(btrim(newer.email)) = lower(btrim(p_email))
            AND newer.id <> o.id AND newer.created_at > o.created_at AND newer.checkout_state = 'paid' AND newer.test_mode IS FALSE))
      AND NOT EXISTS (SELECT 1 FROM public.email_contact_outbox x WHERE x.email = lower(btrim(p_email))
          AND x.status = 'sent' AND x.sent_at > now() - interval '7 days')
      AND NOT EXISTS (SELECT 1 FROM public.email_outbox j JOIN public.orders prior ON prior.id = j.order_id
          WHERE lower(btrim(prior.email)) = lower(btrim(p_email))
            AND j.kind IN ('pendingPayment','postPurchase','reorder','feedback')
            AND j.status = 'sent' AND j.sent_at > now() - interval '7 days')
    WHEN p_kind IN ('cart1','cart2') THEN EXISTS (
        SELECT 1 FROM public.email_carts c WHERE c.email = lower(btrim(p_email))
          AND floor(extract(epoch FROM c.captured_at))::text = p_event_key)
      AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE lower(btrim(o.email)) = lower(btrim(p_email))
          AND o.checkout_state = 'paid' AND o.test_mode IS FALSE
          AND o.created_at >= (SELECT c2.captured_at FROM public.email_carts c2 WHERE c2.email = lower(btrim(p_email))))
    ELSE true
  END;
$$;

-- 4. Packed: enqueue in the same transaction as the move to packing. Transactional, no consent, no promotion.
CREATE OR REPLACE FUNCTION public.enqueue_order_packed_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.workflow_status = 'packing' AND OLD.workflow_status IS DISTINCT FROM 'packing'
    AND NEW.checkout_state = 'paid' AND NEW.test_mode IS FALSE THEN
    INSERT INTO public.email_outbox(order_id,kind,event_key) VALUES (NEW.id,'packed','packing')
      ON CONFLICT (order_id,kind) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_order_packed_email() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS orders_email_packed ON public.orders;
CREATE TRIGGER orders_email_packed AFTER UPDATE OF workflow_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_packed_email();

-- 5. Feedback: scheduled enqueue, wrapped around the existing function so the 15 minute cron job is unchanged.
--    Only runs while the DB switch is on, like the contact queue.
ALTER FUNCTION public.enqueue_due_email_automation() RENAME TO enqueue_due_email_automation_core;
CREATE FUNCTION public.enqueue_due_email_automation() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer; v_order public.orders%ROWTYPE; n integer;
BEGIN
  IF current_user NOT IN ('postgres','service_role') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  v_count := public.enqueue_due_email_automation_core();
  IF NOT EXISTS (SELECT 1 FROM public.email_automation_control WHERE id AND enabled) THEN RETURN v_count; END IF;
  FOR v_order IN SELECT o.* FROM public.orders o WHERE o.test_mode IS FALSE AND o.checkout_state = 'paid'
      AND o.workflow_status IN ('dispatched','complete') AND o.created_at > now() - interval '60 days' LOOP
    IF public.email_job_eligible('feedback',v_order) THEN
      INSERT INTO public.email_outbox(order_id,kind,event_key) VALUES (v_order.id,'feedback','scheduled')
        ON CONFLICT (order_id,kind) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT; v_count := v_count + n;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_due_email_automation(), public.enqueue_due_email_automation_core()
  FROM PUBLIC, anon, authenticated, service_role;

-- 6. Win-back: one email per address, ever (event_key 'once'), day 60 to 63 after the last paid order, still no newer order.
ALTER FUNCTION public.enqueue_due_contact_automation() RENAME TO enqueue_due_contact_automation_core;
CREATE FUNCTION public.enqueue_due_contact_automation() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer; r record; n integer;
BEGIN
  IF current_user NOT IN ('postgres','service_role') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  v_count := public.enqueue_due_contact_automation_core();
  IF NOT EXISTS (SELECT 1 FROM public.email_automation_control WHERE id AND enabled) THEN RETURN v_count; END IF;
  FOR r IN SELECT DISTINCT ON (lower(btrim(o.email))) lower(btrim(o.email)) AS email, split_part(btrim(o.name),' ',1) AS first_name
      FROM public.orders o WHERE o.checkout_state = 'paid' AND o.test_mode IS FALSE
        AND o.created_at BETWEEN now() - interval '63 days' AND now() - interval '60 days'
      ORDER BY lower(btrim(o.email)), o.created_at DESC LOOP
    IF public.email_contact_job_eligible(r.email,'winback','once') THEN
      INSERT INTO public.email_contact_outbox(email,kind,event_key,payload)
        VALUES (r.email,'winback','once',jsonb_build_object('firstName',left(r.first_name,30)))
        ON CONFLICT (email,kind,event_key) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT; v_count := v_count + n;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_due_contact_automation(), public.enqueue_due_contact_automation_core()
  FROM PUBLIC, anon, authenticated, service_role;

-- 7. Grants for the replaced claim functions (same roles as before).
REVOKE ALL ON FUNCTION public.email_job_eligible(text,public.orders), public.claim_email_outbox(integer,text[]),
  public.claim_contact_outbox(integer,text[]), public.email_contact_job_eligible(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(integer,text[]), public.claim_contact_outbox(integer,text[]) TO service_role;
