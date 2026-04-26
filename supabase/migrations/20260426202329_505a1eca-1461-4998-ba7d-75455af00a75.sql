-- 1. Add session_fee to instructors
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS session_fee numeric NOT NULL DEFAULT 50;

-- 2. Restructure ledger: one entry per slot, not per student
ALTER TABLE public.instructor_ledger_entries DROP CONSTRAINT IF EXISTS instructor_ledger_entries_instructor_id_student_id_class_date_key;
ALTER TABLE public.instructor_ledger_entries DROP COLUMN IF EXISTS amount;
ALTER TABLE public.instructor_ledger_entries
  ADD COLUMN IF NOT EXISTS class_time text,
  ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0;

-- Backfill amount for any existing rows from hours*hourly_rate
UPDATE public.instructor_ledger_entries
  SET amount = COALESCE(hours, 0) * COALESCE(hourly_rate, 0)
  WHERE amount = 0;

-- New uniqueness: one entry per instructor per slot per day
DROP INDEX IF EXISTS instructor_ledger_unique_slot;
CREATE UNIQUE INDEX instructor_ledger_unique_slot
  ON public.instructor_ledger_entries (instructor_id, class_date, COALESCE(class_time, ''));

-- 3. Replace the trigger function: flat fee + dedupe per slot
CREATE OR REPLACE FUNCTION public.attendance_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id uuid;
  v_session_fee numeric;
  v_class_time text;
BEGIN
  SELECT s.instructor_id, COALESCE(i.session_fee, 50), s.class_time
    INTO v_instructor_id, v_session_fee, v_class_time
  FROM public.students s
  LEFT JOIN public.instructors i ON i.id = s.instructor_id
  WHERE s.id = NEW.student_id;

  IF v_instructor_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only create a ledger entry when status is present or absent (class did happen)
  IF NEW.status NOT IN ('present', 'absent') THEN
    RETURN NEW;
  END IF;

  -- Insert one entry per (instructor, date, time-slot). Subsequent students same slot = no-op.
  INSERT INTO public.instructor_ledger_entries
    (instructor_id, student_id, class_date, class_time, hours, hourly_rate, amount, source)
  VALUES
    (v_instructor_id, NEW.student_id, NEW.date, v_class_time, 0, 0, v_session_fee, 'attendance')
  ON CONFLICT (instructor_id, class_date, COALESCE(class_time, '')) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. Lock down two_way_messaging — students cannot change it on their own row
CREATE OR REPLACE FUNCTION public.protect_two_way_messaging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the requesting user is the student themselves and they changed two_way_messaging, revert it
  IF auth.uid() = NEW.id AND NEW.two_way_messaging IS DISTINCT FROM OLD.two_way_messaging
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.has_role(auth.uid(), 'instructor'::app_role) THEN
    NEW.two_way_messaging := OLD.two_way_messaging;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_two_way_messaging ON public.students;
CREATE TRIGGER trg_protect_two_way_messaging
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.protect_two_way_messaging();