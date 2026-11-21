-- Run read-only with psql -X -A -t -v ON_ERROR_STOP=1 -f on the target BEFORE the six migrations.
-- The output is executable SQL containing only function definitions and constraint DDL, not customer data.
SELECT '/* Vyrax pre-six-migration function snapshot; keep securely with the release receipt */';
SELECT pg_get_functiondef(p.oid) || ';'
FROM (VALUES
 ('public.email_job_eligible(text,public.orders)'),
 ('public.enqueue_order_email(uuid,text,text)'),
 ('public.enqueue_order_transition_email()'),
 ('public.email_contact_job_eligible(text,text,text)'),
 ('public.claim_email_outbox(integer)'),
 ('public.claim_contact_outbox(integer)'),
 ('public.admin_order_metrics()'),
 ('public.apply_spicepay_event(text,text,text,text,integer,text,boolean,text)')
) AS names(signature)
CROSS JOIN LATERAL (SELECT to_regprocedure(names.signature) AS oid) AS p
ORDER BY names.signature;
SELECT format('ALTER TABLE %s ADD CONSTRAINT %I %s;', c.conrelid::regclass, c.conname, pg_get_constraintdef(c.oid))
FROM pg_constraint c
WHERE (c.conrelid = 'public.orders'::regclass AND c.conname = 'orders_spicepay_valid')
   OR (c.conrelid = 'public.email_outbox'::regclass AND c.conname = 'email_outbox_kind_check')
   OR (c.conrelid = 'public.email_contact_outbox'::regclass AND c.conname = 'email_contact_outbox_kind_check')
ORDER BY c.conname;
SELECT format('ALTER TABLE public.email_automation_control %s ROW LEVEL SECURITY;',
  CASE WHEN relrowsecurity THEN 'ENABLE' ELSE 'DISABLE' END)
FROM pg_class WHERE oid='public.email_automation_control'::regclass;
SELECT format('GRANT %s ON %s TO %I;', string_agg(a.privilege_type, ', ' ORDER BY a.privilege_type), c.oid::regclass, r.rolname)
FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
JOIN pg_roles r ON r.oid=a.grantee
WHERE c.oid IN ('public.mailing_list'::regclass, 'public.reviews'::regclass)
  AND r.rolname IN ('anon','authenticated')
GROUP BY c.oid, r.rolname ORDER BY c.oid::regclass::text, r.rolname;
