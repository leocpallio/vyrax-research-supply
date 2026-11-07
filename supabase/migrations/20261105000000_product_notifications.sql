-- One-off product notifications only. No sender, cron or marketing preference is created here.
CREATE TABLE public.product_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL CHECK (product_slug = 'tirzepatide'),
  strength text NOT NULL CHECK (strength ~ '^[0-9]{1,3}mg$'),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 5 AND 254),
  consent_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('stock', 'lab_report')),
  notified_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  UNIQUE (product_slug, strength, email, source)
);
CREATE TABLE public.product_notification_limits (
  ip_digest text NOT NULL CHECK (length(ip_digest) = 64),
  day date NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_digest, day)
);
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_notification_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_notifications, public.product_notification_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.product_notifications, public.product_notification_limits TO service_role;

-- Both throttling and insertion are atomic. The HTTP handler alone can call this RPC.
CREATE FUNCTION public.record_product_notification(
  p_product_slug text, p_strength text, p_email text, p_source text, p_ip_digest text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_attempts integer;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_product_slug <> 'tirzepatide' OR p_strength !~ '^[0-9]{1,3}mg$'
    OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR p_email <> lower(btrim(p_email)) OR length(p_email) > 254
    OR p_source NOT IN ('stock', 'lab_report') OR p_ip_digest !~ '^[0-9a-f]{64}$'
    THEN RAISE EXCEPTION 'Invalid notification request'; END IF;

  INSERT INTO public.product_notification_limits(ip_digest, day)
    VALUES (p_ip_digest, (now() AT TIME ZONE 'UTC')::date)
    ON CONFLICT (ip_digest, day) DO UPDATE SET attempts = product_notification_limits.attempts + 1
    RETURNING attempts INTO v_attempts;
  IF v_attempts > 5 THEN RETURN false; END IF;

  -- Serialise the global cap across workers so parallel requests cannot evade it.
  PERFORM pg_catalog.pg_advisory_xact_lock(91760511);
  IF (SELECT count(*) FROM public.product_notifications
      WHERE consent_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') >= 300
    THEN RETURN false; END IF;
  INSERT INTO public.product_notifications(product_slug, strength, email, source)
    VALUES (p_product_slug, p_strength, p_email, p_source)
    ON CONFLICT (product_slug, strength, email, source) DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_product_notification(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_product_notification(text,text,text,text,text) TO service_role;