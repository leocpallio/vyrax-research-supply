-- STAGED, NOT APPLIED. Applying a migration is a release step (exact SHA, webqa AGREE, Leo's go).
-- Defence in depth from the 16 Nov 2026 read-only RLS audit. RLS already blocks every case below;
-- this removes the broad default grants so a future policy mistake cannot expose the table.
-- Idempotent and reversible (GRANT the privileges back).

-- mailing_list: visitors may only INSERT (policy "Visitors subscribe"). No reads, edits or deletes.
REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.mailing_list FROM anon, authenticated;

-- reviews: public read of approved rows, members INSERT own unapproved rows. No update or delete.
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.reviews FROM anon, authenticated;
REVOKE INSERT ON public.reviews FROM anon;

-- email_automation_control is service-role only (grants already revoked); also turn RLS on so a
-- later accidental GRANT still returns nothing.
ALTER TABLE public.email_automation_control ENABLE ROW LEVEL SECURITY;
