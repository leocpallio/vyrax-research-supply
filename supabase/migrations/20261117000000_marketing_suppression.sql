-- One marketing suppression list for every channel (site email, cold email via Smartlead, SMS).
-- Order and service mail is NOT affected: email_delivery_suppression (bounce/complaint) stays separate.
-- Written by the public /unsubscribe page and one-click endpoint through suppress_marketing_email().
-- Smartlead and SMS exports read this table; anything listed here is never mailed or texted for marketing.
CREATE TABLE IF NOT EXISTS public.marketing_suppression (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND length(email) <= 254),
  source text NOT NULL CHECK (source ~ '^[a-z0-9_-]{1,40}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_suppression ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_suppression FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.marketing_suppression TO service_role;

CREATE OR REPLACE FUNCTION public.suppress_marketing_email(p_email text, p_source text DEFAULT 'unsubscribe_page')
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_email text := lower(btrim(p_email));
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF v_email IS NULL OR length(v_email) > 254 OR v_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  INSERT INTO public.marketing_suppression(email, source) VALUES (v_email, coalesce(p_source, 'unsubscribe_page'))
    ON CONFLICT (email) DO NOTHING;
  -- Same address may also hold a site marketing consent row: close it so the existing automation stops too.
  UPDATE public.email_marketing_preferences SET unsubscribed_at = coalesce(unsubscribed_at, now())
    WHERE email = v_email;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.suppress_marketing_email(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suppress_marketing_email(text, text) TO service_role;

-- Contact (marketing) automation must honour the shared list as well as the per-token opt-out.
CREATE OR REPLACE FUNCTION public.email_contact_ok(p_email text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    AND lower(p_email) NOT IN ('test@gmail.com','leo.k.kallio@gmail.com')
    AND lower(p_email) !~ '@(example\.(com|org|net)|test\.[a-z]+)$'
    AND NOT EXISTS (SELECT 1 FROM public.marketing_suppression s WHERE s.email = lower(btrim(p_email)))
    AND EXISTS (SELECT 1 FROM public.email_marketing_preferences pref
      WHERE pref.email = lower(btrim(p_email)) AND pref.unsubscribed_at IS NULL AND pref.consented_at <= now());
$$;
