
-- =========================================================
-- 1. student_instructors (many-to-many)
-- =========================================================
CREATE TABLE public.student_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, instructor_id),
  CHECK (role IN ('primary', 'secondary'))
);

CREATE INDEX idx_student_instructors_student ON public.student_instructors(student_id);
CREATE INDEX idx_student_instructors_instructor ON public.student_instructors(instructor_id);

ALTER TABLE public.student_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all student_instructors"
  ON public.student_instructors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors view their own assignments"
  ON public.student_instructors FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Students view their own instructor assignments"
  ON public.student_instructors FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Backfill from existing students.instructor_id
INSERT INTO public.student_instructors (student_id, instructor_id, role)
SELECT id, instructor_id, 'primary'
FROM public.students
WHERE instructor_id IS NOT NULL
ON CONFLICT (student_id, instructor_id) DO NOTHING;

-- =========================================================
-- 2. cover_sessions
-- =========================================================
CREATE TABLE public.cover_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  cover_instructor_id UUID NOT NULL,
  class_date DATE NOT NULL,
  class_time TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, class_date, class_time, cover_instructor_id)
);

CREATE INDEX idx_cover_sessions_lookup ON public.cover_sessions(cover_instructor_id, class_date);
CREATE INDEX idx_cover_sessions_student ON public.cover_sessions(student_id, class_date);

ALTER TABLE public.cover_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all cover_sessions"
  ON public.cover_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cover instructors view their cover sessions"
  ON public.cover_sessions FOR SELECT TO authenticated
  USING (cover_instructor_id = auth.uid());

CREATE POLICY "Cover instructors create their own cover sessions"
  ON public.cover_sessions FOR INSERT TO authenticated
  WITH CHECK (cover_instructor_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Cover instructors delete their own cover sessions"
  ON public.cover_sessions FOR DELETE TO authenticated
  USING (cover_instructor_id = auth.uid());

CREATE POLICY "Primary instructors view cover sessions for their students"
  ON public.cover_sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_instructors si
    WHERE si.student_id = cover_sessions.student_id AND si.instructor_id = auth.uid()
  ));

-- =========================================================
-- 3. Helper function: any instructor (primary/secondary/cover-today) -> student access
-- =========================================================
CREATE OR REPLACE FUNCTION public.can_instructor_access_student(_instructor_id UUID, _student_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_instructors
    WHERE instructor_id = _instructor_id AND student_id = _student_id
  ) OR EXISTS (
    SELECT 1 FROM public.cover_sessions
    WHERE cover_instructor_id = _instructor_id AND student_id = _student_id
  );
$$;

-- =========================================================
-- 4. Update attendance_to_ledger trigger to fan out across all teaching instructors
-- =========================================================
CREATE OR REPLACE FUNCTION public.attendance_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_time TEXT;
  v_session_fee NUMERIC;
  rec RECORD;
BEGIN
  IF NEW.status NOT IN ('present', 'absent') THEN
    RETURN NEW;
  END IF;

  SELECT class_time INTO v_class_time FROM public.students WHERE id = NEW.student_id;

  -- Build set of instructors to credit:
  --  (a) all assigned instructors (primary + secondary) via student_instructors
  --  (b) any cover instructors for this exact (student, date, class_time)
  FOR rec IN
    SELECT DISTINCT instructor_id FROM (
      SELECT si.instructor_id
      FROM public.student_instructors si
      WHERE si.student_id = NEW.student_id
      UNION
      SELECT cs.cover_instructor_id AS instructor_id
      FROM public.cover_sessions cs
      WHERE cs.student_id = NEW.student_id
        AND cs.class_date = NEW.date
        AND COALESCE(cs.class_time, '') = COALESCE(v_class_time, '')
    ) sub
  LOOP
    SELECT COALESCE(session_fee, 50) INTO v_session_fee
    FROM public.instructors WHERE id = rec.instructor_id;

    INSERT INTO public.instructor_ledger_entries
      (instructor_id, student_id, class_date, class_time, hours, hourly_rate, amount, source)
    VALUES
      (rec.instructor_id, NEW.student_id, NEW.date, v_class_time, 0, 0, COALESCE(v_session_fee, 50), 'attendance')
    ON CONFLICT (instructor_id, class_date, COALESCE(class_time, '')) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =========================================================
-- 5. Extend RLS on related tables so secondary + cover instructors get teaching access
-- =========================================================

-- profiles: instructors can view profiles of any student they teach (primary/secondary/cover)
DROP POLICY IF EXISTS "Instructors can view assigned student profiles" ON public.profiles;
CREATE POLICY "Instructors can view assigned student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND public.can_instructor_access_student(auth.uid(), id)
  );

-- students: instructors view + update any assigned student
DROP POLICY IF EXISTS "Instructors can view assigned student records" ON public.students;
CREATE POLICY "Instructors can view assigned student records"
  ON public.students FOR SELECT TO authenticated
  USING (public.can_instructor_access_student(auth.uid(), id));

DROP POLICY IF EXISTS "Instructors can update assigned students" ON public.students;
CREATE POLICY "Instructors can update assigned students"
  ON public.students FOR UPDATE TO authenticated
  USING (public.can_instructor_access_student(auth.uid(), id));

-- attendance: instructors can manage attendance for any student they teach
DROP POLICY IF EXISTS "Instructors can manage attendance" ON public.attendance;
CREATE POLICY "Instructors can manage attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND public.can_instructor_access_student(auth.uid(), student_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'instructor'::app_role)
    AND public.can_instructor_access_student(auth.uid(), student_id)
  );

-- student_progress: same extension
DROP POLICY IF EXISTS "Instructors can view progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can view progress for their students"
  ON public.student_progress FOR SELECT TO authenticated
  USING (public.can_instructor_access_student(auth.uid(), student_id));

DROP POLICY IF EXISTS "Instructors can insert progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can insert progress for their students"
  ON public.student_progress FOR INSERT TO authenticated
  WITH CHECK (public.can_instructor_access_student(auth.uid(), student_id));

DROP POLICY IF EXISTS "Instructors can update progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can update progress for their students"
  ON public.student_progress FOR UPDATE TO authenticated
  USING (public.can_instructor_access_student(auth.uid(), student_id));

DROP POLICY IF EXISTS "Instructors can delete progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can delete progress for their students"
  ON public.student_progress FOR DELETE TO authenticated
  USING (public.can_instructor_access_student(auth.uid(), student_id));

-- student_notes: instructor-side notes for any teaching instructor
DROP POLICY IF EXISTS "Instructors can insert notes for their students" ON public.student_notes;
CREATE POLICY "Instructors can insert notes for their students"
  ON public.student_notes FOR INSERT TO authenticated
  WITH CHECK (
    instructor_id = auth.uid()
    AND public.can_instructor_access_student(auth.uid(), student_id)
  );
