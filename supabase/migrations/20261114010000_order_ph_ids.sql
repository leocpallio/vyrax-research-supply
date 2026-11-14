-- Browser PostHog ids stored on the order so the server-side purchase event joins the visit.
-- Written by the service-role checkout only. Nullable; the insert retries without them if absent.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ph_distinct_id text, ADD COLUMN IF NOT EXISTS ph_session_id text;
