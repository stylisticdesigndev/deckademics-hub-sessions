-- 1. Profiles: phone + pronouns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS pronouns text;

-- 2. Students: two-way messaging toggle
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS two_way_messaging boolean NOT NULL DEFAULT true;

-- 3. Student status table (Running Late)
CREATE TABLE IF NOT EXISTS public.student_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  status text NOT NULL,
  set_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_status_student_id ON public.student_status(student_id);
CREATE INDEX IF NOT EXISTS idx_student_status_set_at ON public.student_status(set_at DESC);

ALTER TABLE public.student_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own status"
  ON public.student_status FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own status"
  ON public.student_status FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view assigned student status"
  ON public.student_status FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_status.student_id
        AND s.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all status"
  ON public.student_status FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Attendance: nullable class_id + relax instructor RLS
ALTER TABLE public.attendance ALTER COLUMN class_id DROP NOT NULL;

DROP POLICY IF EXISTS "Instructors can manage attendance" ON public.attendance;

CREATE POLICY "Instructors can manage attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id
        AND s.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id
        AND s.instructor_id = auth.uid()
    )
  );

-- 5. Instructor ledger entries
CREATE TABLE IF NOT EXISTS public.instructor_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_date date NOT NULL,
  hours numeric NOT NULL DEFAULT 1.5,
  hourly_rate numeric NOT NULL DEFAULT 0,
  amount numeric GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  source text NOT NULL DEFAULT 'attendance',
  payment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, student_id, class_date)
);
CREATE INDEX IF NOT EXISTS idx_ledger_instructor ON public.instructor_ledger_entries(instructor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_unpaid ON public.instructor_ledger_entries(instructor_id) WHERE payment_id IS NULL;

ALTER TABLE public.instructor_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors view own ledger"
  ON public.instructor_ledger_entries FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Admins manage all ledger"
  ON public.instructor_ledger_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_ledger_updated_at
  BEFORE UPDATE ON public.instructor_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when attendance is recorded for a student with assigned instructor, upsert ledger entry
CREATE OR REPLACE FUNCTION public.attendance_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instructor_id uuid;
  v_rate numeric;
BEGIN
  SELECT s.instructor_id, COALESCE(i.hourly_rate, 0)
    INTO v_instructor_id, v_rate
  FROM public.students s
  LEFT JOIN public.instructors i ON i.id = s.instructor_id
  WHERE s.id = NEW.student_id;

  IF v_instructor_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.instructor_ledger_entries
    (instructor_id, student_id, class_date, hours, hourly_rate, source)
  VALUES
    (v_instructor_id, NEW.student_id, NEW.date, 1.5, v_rate, 'attendance')
  ON CONFLICT (instructor_id, student_id, class_date)
  DO UPDATE SET hourly_rate = EXCLUDED.hourly_rate, updated_at = now()
  WHERE public.instructor_ledger_entries.payment_id IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_ledger ON public.attendance;
CREATE TRIGGER trg_attendance_ledger
  AFTER INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.attendance_to_ledger();