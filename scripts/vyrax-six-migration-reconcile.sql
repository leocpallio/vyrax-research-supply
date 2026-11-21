-- READ ONLY. Run on the live project before any ledger repair or DDL. No customer rows read.
-- A fingerprint proves current schema shape, not historical provenance. Any ABSENT or MIXED row
-- among the first ten means stop; do not invent a migration ledger from this report alone.
WITH checks(version, marker_a, marker_b) AS (VALUES
 ('20260928151737', to_regclass('public.orders') IS NOT NULL, to_regclass('public.mailing_list') IS NOT NULL),
 ('20261002000000', to_regprocedure('public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text)') IS NOT NULL, to_regclass('public.spicepay_events') IS NOT NULL),
 ('20261002010000', to_regprocedure('public.admin_order_metrics()') IS NOT NULL, to_regclass('public.admin_members') IS NOT NULL),
 ('20261003000000', EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.orders') AND conname='orders_workflow_status_check' AND pg_get_constraintdef(oid) LIKE '%IS TRUE%'), to_regclass('public.admin_members') IS NOT NULL),
 ('20261006000000', to_regclass('public.email_outbox') IS NOT NULL, coalesce(to_regprocedure('public.claim_email_outbox(integer)'),to_regprocedure('public.claim_email_outbox(integer,text[])')) IS NOT NULL),
 ('20261103000000', EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='utm_source' AND NOT attisdropped), EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='landing_path' AND NOT attisdropped)),
 ('20261105000000', to_regclass('public.product_notifications') IS NOT NULL, to_regprocedure('public.record_product_notification(text,text,text,text,text)') IS NOT NULL),
 ('20261105230000', to_regclass('public.email_contact_outbox') IS NOT NULL, coalesce(to_regprocedure('public.claim_contact_outbox(integer)'),to_regprocedure('public.claim_contact_outbox(integer,text[])')) IS NOT NULL),
 ('20261107000000', to_regclass('public.email_delivery_suppression') IS NOT NULL, to_regclass('public.email_marketing_preferences') IS NOT NULL),
 ('20261114010000', EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='ph_distinct_id' AND NOT attisdropped), EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='ph_session_id' AND NOT attisdropped)),
 ('20261116000000', (SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.email_automation_control')), NOT has_table_privilege('anon','public.mailing_list','SELECT')),
 ('20261117000000', to_regclass('public.email_new_flow_control') IS NOT NULL, to_regprocedure('public.enqueue_due_email_automation_core()') IS NOT NULL),
 ('20261118000000', EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.email_outbox') AND conname='email_outbox_dispatched_needs_tracking'), (SELECT pg_get_functiondef(to_regprocedure('public.email_job_eligible(text,public.orders)')) LIKE '%dispatched%tracking%')),
 ('20261118010000', EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.orders'::regclass AND attname='expired_at' AND NOT attisdropped), to_regprocedure('public.expire_stale_checkouts()') IS NOT NULL),
 ('20261118230000', to_regclass('public.customer_interactions') IS NOT NULL, EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='customer_interactions' AND indexname='uq_ci_dedupe')),
 ('20261119000000', (SELECT pg_get_constraintdef(oid) LIKE '%expired%' FROM pg_constraint WHERE conrelid=to_regclass('public.orders') AND conname='orders_spicepay_valid'), (SELECT pg_get_functiondef(to_regprocedure('public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text)')) LIKE '%payment_expired%'))
)
SELECT version, CASE WHEN marker_a IS TRUE AND marker_b IS TRUE THEN 'PRESENT'
  WHEN marker_a IS FALSE AND marker_b IS FALSE THEN 'ABSENT' ELSE 'MIXED_STOP' END AS schema_fingerprint,
  coalesce(marker_a::text,'missing') AS marker_a, coalesce(marker_b::text,'missing') AS marker_b
FROM checks ORDER BY version;
