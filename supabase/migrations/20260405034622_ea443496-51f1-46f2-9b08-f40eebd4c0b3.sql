ALTER TABLE public.instructor_payments
  ADD COLUMN bonus_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN bonus_description text;