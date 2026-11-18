-- Vyrax email event store (card t_2fa29df6). Same shape as the UKPL public.customer_interactions so
-- email_tracking.py and pull_results.py can read both brands the same way. Additive and idempotent.
-- Written only by the service role (the /api/resend-webhook route); no browser role can read it.
-- Rollback: DROP TABLE public.customer_interactions; (no other table depends on it).

CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL,
  event_type text NOT NULL,
  customer_email text,
  order_id uuid,
  order_number text,
  source_table text,
  source_id text,
  dedupe_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.customer_interactions IS 'Append-only ledger of Resend email events for Vyrax (delivered, bounced, complained, clicked, opened, failed, suppressed). payload carries flow, stage, send_id, brand from the Resend tags.';
CREATE UNIQUE INDEX IF NOT EXISTS uq_ci_dedupe ON public.customer_interactions (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ci_occurred_at ON public.customer_interactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ci_event ON public.customer_interactions (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ci_email ON public.customer_interactions (lower(customer_email), occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ci_resend_id ON public.customer_interactions ((payload->>'resend_id'));

ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_interactions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.customer_interactions TO service_role;
