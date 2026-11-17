-- Scratch-database behaviour check for 20261117000000_email_lifecycle_gap_flows.sql.
-- Run against a throwaway Supabase Postgres after applying every migration (never the live project):
--   docker exec -i <scratch> psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < scripts/verify-lifecycle-gap-migration.sql
-- Rolls everything back. Prints PASS/FAIL rows; any FAIL means do not apply.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
CREATE TEMP TABLE results(name text, ok boolean);
CREATE FUNCTION pg_temp.check(n text, ok boolean) RETURNS void LANGUAGE sql AS $$ INSERT INTO results VALUES (n, coalesce(ok,false)) $$;

CREATE FUNCTION pg_temp.mk(p_id uuid, p_email text, p_name text, p_test boolean, p_wf text, p_age interval) RETURNS void LANGUAGE sql AS $$
  INSERT INTO public.orders(id,email,name,address,postcode,items,total,status,checkout_state,test_mode,workflow_status,total_pence,currency,merchant_id,payment_id,created_at)
  VALUES (p_id,p_email,p_name,'1 Test Road','AB1 2CD','[]'::jsonb,10,'paid','paid',p_test,p_wf,1000,'GBP','m_'||left(p_id::text,8),'p_'||left(p_id::text,8),now()-p_age) $$;

-- constraints include the new kinds
SELECT pg_temp.check('email_outbox CHECK has packed+feedback',
  (SELECT pg_get_constraintdef(oid) LIKE '%packed%' AND pg_get_constraintdef(oid) LIKE '%feedback%'
   FROM pg_constraint WHERE conrelid='public.email_outbox'::regclass AND conname='email_outbox_kind_check'));
SELECT pg_temp.check('email_contact_outbox CHECK has winback',
  (SELECT pg_get_constraintdef(oid) LIKE '%winback%'
   FROM pg_constraint WHERE conrelid='public.email_contact_outbox'::regclass AND conname='email_contact_outbox_kind_check'));

-- fixtures: one paid, live order moving to packing
SELECT pg_temp.mk('11111111-1111-4111-8111-111111111111','pack@example.co.uk','Pat',false,'reviewing','0'::interval);
SELECT pg_temp.mk('22222222-2222-4222-8222-222222222222','test@example.co.uk','Tess',true,'on_hold','0'::interval);
UPDATE public.orders SET workflow_status='packing' WHERE id='11111111-1111-4111-8111-111111111111';
SELECT pg_temp.check('packing enqueues exactly one packed row',
  (SELECT count(*)=1 FROM public.email_outbox WHERE order_id='11111111-1111-4111-8111-111111111111' AND kind='packed'));
UPDATE public.orders SET workflow_status='reviewing' WHERE id='11111111-1111-4111-8111-111111111111';
UPDATE public.orders SET workflow_status='packing' WHERE id='11111111-1111-4111-8111-111111111111';
SELECT pg_temp.check('re-entering packing does not duplicate',
  (SELECT count(*)=1 FROM public.email_outbox WHERE order_id='11111111-1111-4111-8111-111111111111' AND kind='packed'));

-- packed is claimed only when listed in p_kinds
UPDATE public.email_automation_control SET enabled=true;
SELECT pg_temp.check('default claim never returns packed',
  (SELECT count(*)=0 FROM public.claim_email_outbox(20) WHERE kind='packed'));
SELECT pg_temp.check('claim with p_kinds returns packed',
  (SELECT count(*)=1 FROM public.claim_email_outbox(20, ARRAY['packed'])));

-- feedback: needs a sent dispatched row 10-13 days old, plus live consent
SELECT pg_temp.mk('33333333-3333-4333-8333-333333333333','fb@example.co.uk','Fay',false,'dispatched','12 days'::interval);
DELETE FROM public.email_outbox WHERE order_id='33333333-3333-4333-8333-333333333333';
INSERT INTO public.email_outbox(order_id,kind,event_key,status,sent_at)
  VALUES ('33333333-3333-4333-8333-333333333333','dispatched','dispatched','sent',now()-interval '11 days');
SELECT pg_temp.check('feedback not eligible without consent',
  NOT public.email_job_eligible('feedback',(SELECT o FROM public.orders o WHERE id='33333333-3333-4333-8333-333333333333')));
INSERT INTO public.email_marketing_preferences(email,consent_source) VALUES ('fb@example.co.uk','checkout');
SELECT pg_temp.check('feedback eligible with consent, 11 days after dispatch',
  public.email_job_eligible('feedback',(SELECT o FROM public.orders o WHERE id='33333333-3333-4333-8333-333333333333')));
UPDATE public.email_outbox SET sent_at=now()-interval '5 days' WHERE order_id='33333333-3333-4333-8333-333333333333' AND kind='dispatched';
SELECT pg_temp.check('feedback not eligible 5 days after dispatch',
  NOT public.email_job_eligible('feedback',(SELECT o FROM public.orders o WHERE id='33333333-3333-4333-8333-333333333333')));
UPDATE public.email_outbox SET sent_at=now()-interval '11 days' WHERE order_id='33333333-3333-4333-8333-333333333333' AND kind='dispatched';
SELECT public.enqueue_due_email_automation();
SELECT public.enqueue_due_email_automation();
SELECT pg_temp.check('scheduler enqueues feedback exactly once',
  (SELECT count(*)=1 FROM public.email_outbox WHERE order_id='33333333-3333-4333-8333-333333333333' AND kind='feedback'));
UPDATE public.email_marketing_preferences SET unsubscribed_at=now() WHERE email='fb@example.co.uk';
SELECT pg_temp.check('unsubscribe revokes feedback eligibility',
  NOT public.email_job_eligible('feedback',(SELECT o FROM public.orders o WHERE id='33333333-3333-4333-8333-333333333333')));
SELECT pg_temp.check('feedback never claimed by default call',
  (SELECT count(*)=0 FROM public.claim_email_outbox(20) WHERE kind='feedback'));

-- win-back: last paid order 61 days ago, consent, nothing newer
SELECT pg_temp.mk('44444444-4444-4444-8444-444444444444','wb@example.co.uk','Wes Hunt',false,'complete','61 days'::interval);
SELECT pg_temp.check('winback not eligible without consent',
  NOT public.email_contact_job_eligible('wb@example.co.uk','winback','once'));
INSERT INTO public.email_marketing_preferences(email,consent_source) VALUES ('wb@example.co.uk','checkout');
SELECT pg_temp.check('winback eligible at day 61 with consent',
  public.email_contact_job_eligible('wb@example.co.uk','winback','once'));
SELECT pg_temp.check('winback needs event_key once',
  NOT public.email_contact_job_eligible('wb@example.co.uk','winback','x'));
SELECT public.enqueue_due_contact_automation();
SELECT public.enqueue_due_contact_automation();
SELECT pg_temp.check('scheduler enqueues one winback with first name payload',
  (SELECT count(*)=1 AND min(payload->>'firstName')='Wes' FROM public.email_contact_outbox WHERE email='wb@example.co.uk' AND kind='winback'));
SELECT pg_temp.check('default contact claim never returns winback',
  (SELECT count(*)=0 FROM public.claim_contact_outbox(20) WHERE kind='winback'));
SELECT pg_temp.check('contact claim with p_kinds returns winback',
  (SELECT count(*)=1 FROM public.claim_contact_outbox(20, ARRAY['winback'])));
SELECT pg_temp.mk('55555555-5555-4555-8555-555555555555','wb@example.co.uk','Wes Hunt',false,'unreviewed','2 days'::interval);
SELECT pg_temp.check('a newer paid order cancels win-back eligibility',
  NOT public.email_contact_job_eligible('wb@example.co.uk','winback','once'));

-- DB switch off: nothing new is enqueued
UPDATE public.email_automation_control SET enabled=false;
DELETE FROM public.email_outbox WHERE kind='feedback';
SELECT public.enqueue_due_email_automation();
SELECT pg_temp.check('switch off enqueues no feedback',
  (SELECT count(*)=0 FROM public.email_outbox WHERE kind='feedback'));

-- existing cron jobs unchanged
SELECT pg_temp.check('exactly the three existing cron jobs, same schedules (run on a freshly reset scratch DB)',
  (SELECT count(*)=3 AND bool_and((jobname,schedule) IN
    (('vyrax-email-enqueue','*/15 * * * *'),('vyrax-email-delivery','*/5 * * * *'),('vyrax-contact-enqueue','*/15 * * * *')))
   FROM cron.job));

SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name FROM results ORDER BY ok, name;
ROLLBACK;
