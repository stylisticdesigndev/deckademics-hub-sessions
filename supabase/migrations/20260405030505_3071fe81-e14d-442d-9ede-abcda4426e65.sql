
-- Add new columns (nullable first for backfill)
ALTER TABLE public.instructor_payments
  ADD COLUMN IF NOT EXISTS pay_period_start date,
  ADD COLUMN IF NOT EXISTS pay_period_end date,
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'class';

-- Backfill existing rows
UPDATE public.instructor_payments
SET
  pay_period_start = COALESCE(payment_date::date, CURRENT_DATE),
  pay_period_end = COALESCE(payment_date::date, CURRENT_DATE),
  payment_type = 'class'
WHERE pay_period_start IS NULL;

-- Now set NOT NULL constraints
ALTER TABLE public.instructor_payments
  ALTER COLUMN pay_period_start SET NOT NULL,
  ALTER COLUMN pay_period_start SET DEFAULT CURRENT_DATE,
  ALTER COLUMN pay_period_end SET NOT NULL,
  ALTER COLUMN pay_period_end SET DEFAULT CURRENT_DATE,
  ALTER COLUMN payment_type SET NOT NULL;
