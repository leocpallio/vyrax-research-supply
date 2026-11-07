-- Consent lifecycle gating (supersedes in-place edit of 20261006000000, which is already applied).
-- Adds bounce/complaint suppression, 7-day cross-flow frequency cap, 48h job expiry. Sender stays off by flag.
-- Bounce/complaint suppression is independent of marketing consent.
CREATE TABLE IF NOT EXISTS public.email_delivery_suppression (
  email text PRIMARY KEY CHECK (email = lower(btrim(email))),
  reason text NOT NULL CHECK (reason IN ('bounce','complaint','manual')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_delivery_suppression ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_delivery_suppression FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_delivery_suppression TO service_role;

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
      ELSE false
    END
    AND (p_kind NOT IN ('pendingPayment','postPurchase','reorder') OR EXISTS (
      SELECT 1 FROM public.email_marketing_preferences pref WHERE pref.email = lower(btrim((p_order).email))
        AND pref.unsubscribed_at IS NULL AND pref.consented_at <= now()
    ))
    AND (p_kind NOT IN ('pendingPayment','postPurchase','reorder') OR NOT EXISTS (
      SELECT 1 FROM public.email_outbox j JOIN public.orders prior ON prior.id = j.order_id
      WHERE lower(btrim(prior.email)) = lower(btrim((p_order).email))
        AND j.kind IN ('pendingPayment','postPurchase','reorder')
        AND j.status = 'sent' AND j.sent_at > now() - interval '7 days'
    ));
$$;

CREATE OR REPLACE FUNCTION public.claim_email_outbox(p_limit integer DEFAULT 20)
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
    AND (j.attempts >= 8 OR j.created_at < now() - interval '48 hours'
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

CREATE OR REPLACE FUNCTION public.finish_email_outbox(p_id uuid,p_claim_token uuid,p_success boolean,p_provider_id text DEFAULT NULL,p_error text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.email_outbox SET
    status = CASE WHEN p_success THEN 'sent' WHEN attempts >= 8 OR created_at < now() - interval '48 hours' THEN 'failed' ELSE 'queued' END,
    sent_at = CASE WHEN p_success THEN now() ELSE NULL END,
    provider_id = CASE WHEN p_success THEN left(p_provider_id,200) ELSE NULL END,
    last_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error,'delivery failed'),120) END,
    available_at = CASE WHEN p_success THEN available_at ELSE now() + make_interval(mins => least(360,(2 ^ least(attempts,8))::integer)) END,
    claim_token = NULL, lease_until = NULL
    WHERE email_outbox.id = p_id AND email_outbox.claim_token = p_claim_token AND status = 'processing';
  RETURN FOUND;
END $$;
