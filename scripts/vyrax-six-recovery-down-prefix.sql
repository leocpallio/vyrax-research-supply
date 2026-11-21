-- Run only after an approved incident decision; before.sql was captured from THIS database before up.
-- One psql session: -f down-prefix.sql -f before.sql -f down-suffix.sql, ON_ERROR_STOP=1.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.email_new_flow_control') IS NULL OR
     to_regprocedure('public.enqueue_due_email_automation_core()') IS NULL OR
     to_regprocedure('public.enqueue_due_contact_automation_core()') IS NULL OR
     to_regclass('public.customer_interactions') IS NULL OR
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='expired_at')
  THEN RAISE EXCEPTION 'Six-migration schema not complete; stop and reconcile manually'; END IF;
  IF EXISTS (SELECT 1 FROM public.email_new_flow_control WHERE enabled) OR
     EXISTS (SELECT 1 FROM public.email_outbox WHERE kind IN ('packed','feedback')) OR
     EXISTS (SELECT 1 FROM public.email_contact_outbox WHERE kind='winback')
  THEN RAISE EXCEPTION 'New flow enabled or jobs exist; halt, never silently erase or send customer mail'; END IF;
END $$;
-- Prevent future expiry jobs before removing the function. The job is only introduced by this six-file batch.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'vyrax-expire-stale-checkouts';
DROP FUNCTION public.expire_stale_checkouts();
-- Remove only objects created in the six-file batch. Preserve customer event data and expired_at if populated.
DROP TRIGGER orders_email_packed ON public.orders;
DROP FUNCTION public.enqueue_order_packed_email();
DROP FUNCTION public.enqueue_due_email_automation();
ALTER FUNCTION public.enqueue_due_email_automation_core() RENAME TO enqueue_due_email_automation;
DROP FUNCTION public.enqueue_due_contact_automation();
ALTER FUNCTION public.enqueue_due_contact_automation_core() RENAME TO enqueue_due_contact_automation;
DROP FUNCTION public.claim_email_outbox(integer,text[]);
DROP FUNCTION public.claim_contact_outbox(integer,text[]);
ALTER TABLE public.orders DROP CONSTRAINT orders_spicepay_valid;
ALTER TABLE public.email_outbox DROP CONSTRAINT email_outbox_kind_check;
ALTER TABLE public.email_contact_outbox DROP CONSTRAINT email_contact_outbox_kind_check;
ALTER TABLE public.email_outbox DROP CONSTRAINT IF EXISTS email_outbox_dispatched_needs_tracking;
REVOKE ALL ON public.mailing_list, public.reviews FROM anon, authenticated;
-- The next file restores definitions and constraints from the actual pre-change database.
