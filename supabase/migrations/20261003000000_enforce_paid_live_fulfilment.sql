-- PostgreSQL CHECK accepts UNKNOWN. The previous predicate could therefore
-- allow a legacy order with NULL checkout_state into a fulfilment state.
-- Replace it with a two-valued guard: only a paid, non-test order may advance.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_workflow_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_workflow_status_check CHECK (
    workflow_status IN ('unreviewed', 'reviewing', 'on_hold', 'packing', 'dispatched', 'complete')
    AND (
      workflow_status NOT IN ('packing', 'dispatched', 'complete')
      OR (checkout_state = 'paid' AND test_mode IS FALSE) IS TRUE
    )
  );
