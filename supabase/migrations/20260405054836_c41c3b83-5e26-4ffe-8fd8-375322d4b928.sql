ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_student_id_profiles_fkey;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (
    status = ANY (
      ARRAY[
        'pending'::text,
        'completed'::text,
        'partial'::text,
        'failed'::text,
        'refunded'::text
      ]
    )
  );