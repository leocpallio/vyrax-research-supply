-- First-touch order attribution (UTMs + ad click ids). Written by the service-role checkout only.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS utm_source text, ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text, ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text, ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS fbclid text, ADD COLUMN IF NOT EXISTS ttclid text,
  ADD COLUMN IF NOT EXISTS landing_path text;
