-- Finalise the one transaction begun in down-prefix, after the pre-change snapshot restores definitions.
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(integer), public.claim_contact_outbox(integer) TO service_role;
DROP FUNCTION public.email_new_flow_enabled(text);
DROP TABLE public.email_new_flow_control;
-- The tracking event table and expiry column are intentionally kept if populated: rollback never deletes data.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customer_interactions) THEN
    DROP TABLE public.customer_interactions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE expired_at IS NOT NULL) THEN
    ALTER TABLE public.orders DROP COLUMN expired_at;
  END IF;
END $$;
COMMIT;
