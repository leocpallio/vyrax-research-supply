-- Vyrax contact-level email automation: welcome series d1-d3, abandoned basket 1 and 2, back-in-stock.
-- Additive and idempotent. Delivery stays gated by public.email_automation_control (disabled by default),
-- and every send requires active consent in public.email_marketing_preferences (no unsubscribe).

CREATE TABLE IF NOT EXISTS public.email_carts (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 5 AND 254),
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 30),
  captured_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.email_stock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 5 AND 254),
  slug text NOT NULL CHECK (length(slug) BETWEEN 1 AND 80),
  strength text NOT NULL DEFAULT '' CHECK (length(strength) <= 20),
  requested_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  UNIQUE (email, slug, strength)
);
CREATE TABLE IF NOT EXISTS public.email_contact_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 5 AND 254),
  kind text NOT NULL CHECK (kind IN ('welcomeD1','welcomeD2','welcomeD3','cart1','cart2','backInStock')),
  event_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','sent','failed','cancelled')),
  available_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  lease_until timestamptz,
  claim_token uuid,
  sent_at timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, kind, event_key)
);
CREATE INDEX IF NOT EXISTS email_contact_outbox_due ON public.email_contact_outbox (status, available_at);

ALTER TABLE public.email_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contact_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_carts, public.email_stock_requests, public.email_contact_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_carts, public.email_stock_requests, public.email_contact_outbox TO service_role;

-- Consent and suppression for contact mail. Test and placeholder addresses never qualify.
CREATE OR REPLACE FUNCTION public.email_contact_ok(p_email text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND lower(p_email) NOT IN ('test@gmail.com','leo.k.kallio@gmail.com')
    AND lower(p_email) !~ '@(example\.(com|org|net)|test\.[a-z]+)$'
    AND EXISTS (SELECT 1 FROM public.email_marketing_preferences pref
      WHERE pref.email = lower(btrim(p_email)) AND pref.unsubscribed_at IS NULL AND pref.consented_at <= now());
$$;

-- A basket stops being "abandoned" once the same address has a paid order after it was captured.
CREATE OR REPLACE FUNCTION public.email_contact_job_eligible(p_email text, p_kind text, p_event_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.email_contact_ok(p_email) AND CASE
    WHEN p_kind IN ('cart1','cart2') THEN EXISTS (
        SELECT 1 FROM public.email_carts c WHERE c.email = lower(btrim(p_email))
          AND floor(extract(epoch FROM c.captured_at))::text = p_event_key)
      AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE lower(btrim(o.email)) = lower(btrim(p_email))
          AND o.checkout_state = 'paid' AND o.test_mode IS FALSE
          AND o.created_at >= (SELECT c2.captured_at FROM public.email_carts c2 WHERE c2.email = lower(btrim(p_email))))
    ELSE true
  END;
$$;

CREATE OR REPLACE FUNCTION public.request_stock_notice(p_email text, p_slug text, p_strength text DEFAULT '') RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.email_stock_requests(email,slug,strength)
    VALUES (lower(btrim(p_email)), left(btrim(p_slug),80), left(btrim(coalesce(p_strength,'')),20))
    ON CONFLICT (email,slug,strength) DO UPDATE SET notified_at = NULL, requested_at = now()
      WHERE public.email_stock_requests.notified_at IS NOT NULL;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.save_email_cart(p_email text, p_items jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  INSERT INTO public.email_carts(email,items) VALUES (lower(btrim(p_email)), p_items)
    ON CONFLICT (email) DO UPDATE SET items = EXCLUDED.items, updated_at = now(),
      captured_at = CASE WHEN public.email_carts.updated_at < now() - interval '72 hours' THEN now() ELSE public.email_carts.captured_at END;
  RETURN true;
END $$;

-- Called by the owner after restocking one product. Queues one notice per waiting address.
CREATE OR REPLACE FUNCTION public.release_stock_requests(p_slug text, p_strength text DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer := 0; r record;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  FOR r IN SELECT * FROM public.email_stock_requests
      WHERE slug = p_slug AND notified_at IS NULL AND (p_strength IS NULL OR strength = p_strength) LOOP
    INSERT INTO public.email_contact_outbox(email,kind,event_key,payload)
      VALUES (r.email,'backInStock', floor(extract(epoch FROM now()))::text,
              jsonb_build_object('slug',r.slug,'strength',r.strength))
      ON CONFLICT (email,kind,event_key) DO NOTHING;
    UPDATE public.email_stock_requests SET notified_at = now() WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.enqueue_due_contact_automation() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_count integer := 0; r record; n integer;
BEGIN
  IF current_user NOT IN ('postgres','service_role') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.email_automation_control WHERE id AND enabled) THEN RETURN 0; END IF;
  -- Welcome series: only guide sign-ups from the cut-over onwards, each step inside a 2 day window.
  FOR r IN SELECT p.email, p.consented_at, s.step FROM public.email_marketing_preferences p
      CROSS JOIN (VALUES (1),(2),(3)) AS s(step)
      WHERE p.consent_source = 'vyrax_guide' AND p.unsubscribed_at IS NULL
        AND p.consented_at >= timestamptz '2026-11-06 00:00:00+00'
        AND now() >= p.consented_at + make_interval(days => s.step)
        AND now() <  p.consented_at + make_interval(days => s.step + 2) LOOP
    IF public.email_contact_ok(r.email) THEN
      INSERT INTO public.email_contact_outbox(email,kind,event_key) VALUES (r.email,'welcomeD'||r.step,'series')
        ON CONFLICT (email,kind,event_key) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT; v_count := v_count + n;
    END IF;
  END LOOP;
  -- Basket 1: one hour after the last change, basket 2: 24 hours after capture, each inside a 24 hour window.
  FOR r IN SELECT c.email, floor(extract(epoch FROM c.captured_at))::text AS ek, c.items, c.updated_at, c.captured_at FROM public.email_carts c
      WHERE c.updated_at < now() - interval '1 hour' AND c.updated_at > now() - interval '25 hours' LOOP
    IF public.email_contact_job_eligible(r.email,'cart1',r.ek) THEN
      INSERT INTO public.email_contact_outbox(email,kind,event_key,payload) VALUES (r.email,'cart1',r.ek,jsonb_build_object('items',r.items))
        ON CONFLICT (email,kind,event_key) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT; v_count := v_count + n;
    END IF;
  END LOOP;
  FOR r IN SELECT c.email, floor(extract(epoch FROM c.captured_at))::text AS ek, c.items FROM public.email_carts c
      WHERE c.captured_at < now() - interval '24 hours' AND c.captured_at > now() - interval '48 hours'
        AND EXISTS (SELECT 1 FROM public.email_contact_outbox x WHERE x.email = c.email AND x.kind = 'cart1'
          AND x.event_key = floor(extract(epoch FROM c.captured_at))::text AND x.status = 'sent') LOOP
    IF public.email_contact_job_eligible(r.email,'cart2',r.ek) THEN
      INSERT INTO public.email_contact_outbox(email,kind,event_key,payload) VALUES (r.email,'cart2',r.ek,jsonb_build_object('items',r.items))
        ON CONFLICT (email,kind,event_key) DO NOTHING;
      GET DIAGNOSTICS n = ROW_COUNT; v_count := v_count + n;
    END IF;
  END LOOP;
  RETURN v_count;
END $$;

CREATE OR REPLACE FUNCTION public.claim_contact_outbox(p_limit integer DEFAULT 20)
RETURNS TABLE(id uuid,email text,kind text,event_key text,payload jsonb,claim_token uuid,unsubscribe_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_contact_outbox j SET status = 'cancelled', claim_token = NULL, lease_until = NULL
    WHERE j.status IN ('queued','processing') AND (j.lease_until IS NULL OR j.lease_until < now())
      AND (NOT public.email_contact_job_eligible(j.email,j.kind,j.event_key) OR j.created_at < now() - interval '48 hours');
  RETURN QUERY
    WITH picked AS (SELECT j.id FROM public.email_contact_outbox j
      WHERE (j.status = 'queued' AND j.available_at <= now()) OR (j.status = 'processing' AND j.lease_until < now())
      ORDER BY j.available_at, j.id FOR UPDATE SKIP LOCKED LIMIT p_limit),
    claimed AS (UPDATE public.email_contact_outbox j SET status = 'processing', attempts = j.attempts + 1,
        lease_until = now() + interval '5 minutes', claim_token = gen_random_uuid()
      FROM picked p WHERE j.id = p.id AND j.attempts < 8
      RETURNING j.id,j.email,j.kind,j.event_key,j.payload,j.claim_token)
    SELECT c.id,c.email,c.kind,c.event_key,c.payload,c.claim_token,pref.unsubscribe_token
      FROM claimed c JOIN public.email_marketing_preferences pref ON pref.email = c.email;
END $$;

CREATE OR REPLACE FUNCTION public.finish_contact_outbox(p_id uuid,p_claim_token uuid,p_success boolean,p_provider_id text DEFAULT NULL,p_error text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_contact_outbox SET
    status = CASE WHEN p_success THEN 'sent' WHEN attempts >= 8 OR created_at < now() - interval '20 hours' THEN 'failed' ELSE 'queued' END,
    sent_at = CASE WHEN p_success THEN now() ELSE NULL END,
    provider_id = CASE WHEN p_success THEN left(p_provider_id,200) ELSE NULL END,
    last_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error,'delivery failed'),120) END,
    available_at = CASE WHEN p_success THEN available_at ELSE now() + make_interval(mins => least(360,(2 ^ least(attempts,8))::integer)) END,
    claim_token = NULL, lease_until = NULL
    WHERE email_contact_outbox.id = p_id AND email_contact_outbox.claim_token = p_claim_token AND status = 'processing';
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.recheck_contact_outbox(p_id uuid,p_claim_token uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN auth.role() <> 'service_role' THEN false ELSE EXISTS (
    SELECT 1 FROM public.email_contact_outbox j WHERE j.id = p_id AND j.claim_token = p_claim_token
      AND j.status = 'processing' AND j.lease_until > now()
      AND public.email_contact_job_eligible(j.email,j.kind,j.event_key)) END;
$$;

REVOKE ALL ON FUNCTION public.email_contact_ok(text), public.email_contact_job_eligible(text,text,text),
  public.request_stock_notice(text,text,text), public.save_email_cart(text,jsonb), public.release_stock_requests(text,text),
  public.enqueue_due_contact_automation(), public.claim_contact_outbox(integer),
  public.finish_contact_outbox(uuid,uuid,boolean,text,text), public.recheck_contact_outbox(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_stock_notice(text,text,text), public.save_email_cart(text,jsonb),
  public.release_stock_requests(text,text), public.claim_contact_outbox(integer),
  public.finish_contact_outbox(uuid,uuid,boolean,text,text), public.recheck_contact_outbox(uuid,uuid) TO service_role;

SELECT cron.schedule('vyrax-contact-enqueue', '*/15 * * * *', 'SELECT public.enqueue_due_contact_automation()');
