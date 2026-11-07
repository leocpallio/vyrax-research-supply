-- No sends are enabled by this migration. Enable the DB switch and app flag only after preview approval.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
CREATE TABLE public.email_marketing_preferences (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 5 AND 254),
  consented_at timestamptz NOT NULL DEFAULT now(),
  consent_source text NOT NULL,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()
);
CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder')),
  event_key text NOT NULL CHECK (length(event_key) BETWEEN 1 AND 200),
  tracking_number text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','sent','failed','cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 8),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  claim_token uuid,
  provider_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (order_id,kind)
);
CREATE INDEX email_outbox_due_idx ON public.email_outbox(available_at,id) WHERE status IN ('queued','processing');
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_marketing_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_outbox, public.email_marketing_preferences FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_outbox, public.email_marketing_preferences TO service_role;

-- Only explicit opt-in may create a preference. An existing unsubscribe cannot be silently reset.
CREATE FUNCTION public.record_email_marketing_consent(p_email text, p_source text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_email text := lower(btrim(p_email)); v_token uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(v_email) > 254 OR p_source !~ '^[a-z0-9_-]{1,40}$' THEN RAISE EXCEPTION 'Invalid consent'; END IF;
  INSERT INTO public.email_marketing_preferences(email,consent_source) VALUES (v_email,p_source)
    ON CONFLICT (email) DO NOTHING;
  SELECT unsubscribe_token INTO v_token FROM public.email_marketing_preferences WHERE email = v_email AND unsubscribed_at IS NULL;
  RETURN v_token;
END $$;
CREATE FUNCTION public.unsubscribe_email_marketing(p_token uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_marketing_preferences SET unsubscribed_at = coalesce(unsubscribed_at,now())
    WHERE unsubscribe_token = p_token;
  RETURN FOUND;
END $$;

-- The same predicate runs both at enqueue and at claim. All automated follow-ups require consent.
CREATE FUNCTION public.email_job_eligible(p_kind text, p_order public.orders) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ((p_order).test_mode IS FALSE)
    AND (p_order).status <> 'internal_test'
    AND (p_order).email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND lower((p_order).email) NOT IN ('test@gmail.com','leo.k.kallio@gmail.com')
    AND lower((p_order).email) !~ '@(example\.(com|org|net)|test\.[a-z]+)$'
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
      ELSE false
    END
    AND (p_kind NOT IN ('pendingPayment','postPurchase','reorder') OR EXISTS (
      SELECT 1 FROM public.email_marketing_preferences pref WHERE pref.email = lower(btrim((p_order).email))
        AND pref.unsubscribed_at IS NULL AND pref.consented_at <= now()
    ));
$$;

CREATE FUNCTION public.enqueue_order_email(p_order_id uuid,p_kind text,p_event_key text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_order public.orders%ROWTYPE; v_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF length(p_event_key) NOT BETWEEN 1 AND 200 OR p_kind NOT IN
    ('orderConfirmation','paymentFailed','paymentExpired','dispatched','pendingPayment','postPurchase','reorder')
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

-- Trigger creates confirmation in the SAME transaction as paid status (including direct RPC calls).
-- Failed/expired events are separately enqueued by the signed webhook only after event validation.
CREATE FUNCTION public.enqueue_order_transition_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.checkout_state = 'paid' AND OLD.checkout_state IS DISTINCT FROM 'paid' AND NEW.test_mode IS FALSE THEN
    INSERT INTO public.email_outbox(order_id,kind,event_key) VALUES (NEW.id,'orderConfirmation','paid')
      ON CONFLICT (order_id,kind) DO NOTHING;
  END IF;
  IF NEW.workflow_status = 'dispatched' AND OLD.workflow_status IS DISTINCT FROM 'dispatched'
    AND NEW.checkout_state = 'paid' AND NEW.test_mode IS FALSE THEN
    INSERT INTO public.email_outbox(order_id,kind,event_key,tracking_number) VALUES (NEW.id,'dispatched','dispatched',NEW.tracking_number)
      ON CONFLICT (order_id,kind) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_email_transitions AFTER UPDATE OF checkout_state,workflow_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_order_transition_email();

CREATE FUNCTION public.enqueue_due_email_automation() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer := 0; v_kind text; v_order public.orders%ROWTYPE;
BEGIN
  -- pg_cron runs as the scheduling DB owner; this function is not exposed to browsers.
  IF current_user NOT IN ('postgres','service_role') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  FOR v_order IN SELECT * FROM public.orders o WHERE o.test_mode IS FALSE
      AND o.created_at > now() - interval '45 days' AND o.created_at < now() - interval '1 hour'
      ORDER BY o.created_at DESC LOOP
    FOREACH v_kind IN ARRAY ARRAY['pendingPayment','postPurchase','reorder'] LOOP
      IF public.email_job_eligible(v_kind,v_order) THEN
        INSERT INTO public.email_outbox(order_id,kind,event_key) VALUES (v_order.id,v_kind,'scheduled')
          ON CONFLICT (order_id,kind) DO NOTHING;
        IF FOUND THEN v_count := v_count + 1; END IF;
      END IF;
    END LOOP;
  END LOOP;
  RETURN v_count;
END $$;

CREATE FUNCTION public.claim_email_outbox(p_limit integer DEFAULT 20)
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
    AND (j.attempts >= 8 OR j.created_at < now() - interval '20 hours'
      OR (j.status = 'queued' AND NOT public.email_job_eligible(j.kind,o))
      OR (j.status = 'processing' AND j.lease_until < now() AND NOT public.email_job_eligible(j.kind,o)));
  RETURN QUERY
    WITH picked AS (SELECT j.id FROM public.email_outbox j
      WHERE (j.status = 'queued' AND j.available_at <= now())
        OR (j.status = 'processing' AND j.lease_until < now())
      ORDER BY j.available_at,j.id FOR UPDATE SKIP LOCKED LIMIT p_limit),
    claimed AS (UPDATE public.email_outbox j SET status = 'processing', attempts = j.attempts + 1,
        lease_until = now() + interval '5 minutes', claim_token = gen_random_uuid()
      FROM picked p, public.orders o WHERE j.id = p.id AND o.id = j.order_id
        AND j.attempts < 8 AND public.email_job_eligible(j.kind,o)
      RETURNING j.id,j.order_id,j.kind,j.claim_token,j.tracking_number)
    SELECT c.id,c.order_id,c.kind,c.claim_token,o.email,o.name,o.address,o.address2,o.city,o.postcode,o.created_at,o.items,o.total_pence,c.tracking_number,
      pref.unsubscribe_token,o.merchant_id,o.payment_id FROM claimed c JOIN public.orders o ON o.id = c.order_id
      LEFT JOIN public.email_marketing_preferences pref ON pref.email = lower(btrim(o.email))
        AND c.kind IN ('pendingPayment','postPurchase','reorder');
END $$;
CREATE FUNCTION public.finish_email_outbox(p_id uuid,p_claim_token uuid,p_success boolean,p_provider_id text DEFAULT NULL,p_error text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_outbox SET
    status = CASE WHEN p_success THEN 'sent' WHEN attempts >= 8 OR created_at < now() - interval '20 hours' THEN 'failed' ELSE 'queued' END,
    sent_at = CASE WHEN p_success THEN now() ELSE NULL END,
    provider_id = CASE WHEN p_success THEN left(p_provider_id,200) ELSE NULL END,
    last_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error,'delivery failed'),120) END,
    available_at = CASE WHEN p_success THEN available_at ELSE now() + make_interval(mins => least(360,(2 ^ least(attempts,8))::integer)) END,
    claim_token = NULL, lease_until = NULL
    WHERE email_outbox.id = p_id AND email_outbox.claim_token = p_claim_token AND status = 'processing';
  RETURN FOUND;
END $$;

CREATE FUNCTION public.recheck_email_outbox(p_id uuid,p_claim_token uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN auth.role() <> 'service_role' THEN false ELSE EXISTS (
    SELECT 1 FROM public.email_outbox j JOIN public.orders o ON o.id = j.order_id
      WHERE j.id = p_id AND j.claim_token = p_claim_token AND j.status = 'processing'
        AND j.lease_until > now() AND public.email_job_eligible(j.kind,o)
  ) END;
$$;
REVOKE ALL ON FUNCTION public.record_email_marketing_consent(text,text), public.unsubscribe_email_marketing(uuid),
  public.email_job_eligible(text,public.orders), public.enqueue_order_email(uuid,text,text),
  public.enqueue_due_email_automation(), public.claim_email_outbox(integer), public.recheck_email_outbox(uuid,uuid),
  public.finish_email_outbox(uuid,uuid,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_email_marketing_consent(text,text), public.unsubscribe_email_marketing(uuid),
  public.enqueue_order_email(uuid,text,text), public.claim_email_outbox(integer), public.recheck_email_outbox(uuid,uuid),
  public.finish_email_outbox(uuid,uuid,boolean,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.enqueue_due_email_automation(), public.enqueue_order_transition_email() FROM PUBLIC, anon, authenticated, service_role;
-- SQL scheduler only enqueues. HTTP delivery is separately guarded, disabled by default.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
SELECT cron.schedule('vyrax-email-enqueue', '*/15 * * * *', 'SELECT public.enqueue_due_email_automation()');
CREATE TABLE public.email_automation_control (id boolean PRIMARY KEY DEFAULT true CHECK (id), enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.email_automation_control(id,enabled) VALUES (true,false);
REVOKE ALL ON public.email_automation_control FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.run_email_delivery_cron() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_secret text;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.email_automation_control WHERE id AND enabled) THEN RETURN; END IF;
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'vyrax_email_cron_secret' LIMIT 1;
  IF v_secret IS NULL THEN RETURN; END IF;
  PERFORM net.http_post(url := 'https://vyraxlabs.co.uk/api/email-automation',
    headers := jsonb_build_object('Content-Type','application/json','x-vyrax-cron-secret',v_secret),
    body := '{}'::jsonb, timeout_milliseconds := 120000);
END $$;
REVOKE ALL ON FUNCTION public.run_email_delivery_cron() FROM PUBLIC, anon, authenticated, service_role;
SELECT cron.schedule('vyrax-email-delivery', '*/5 * * * *', 'SELECT public.run_email_delivery_cron()');
