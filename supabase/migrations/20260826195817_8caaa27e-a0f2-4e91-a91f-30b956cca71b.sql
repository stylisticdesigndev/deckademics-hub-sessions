
-- 1. Announcements: prevent authorship transfer
DROP POLICY IF EXISTS "Authors can update their announcements" ON public.announcements;
CREATE POLICY "Authors can update their announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- 2. Classes: prevent instructor reassignment via self-update
DROP POLICY IF EXISTS "Instructors can update their own classes" ON public.classes;
CREATE POLICY "Instructors can update their own classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

-- 3. student_status: constrain values and allow owners/instructors to clean up
ALTER TABLE public.student_status
  DROP CONSTRAINT IF EXISTS student_status_status_check;
ALTER TABLE public.student_status
  ADD CONSTRAINT student_status_status_check
  CHECK (status IN ('running_late', 'absent', 'present', 'excused'));

DROP POLICY IF EXISTS "Students can insert own status" ON public.student_status;
CREATE POLICY "Students can insert own status"
ON public.student_status
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND status IN ('running_late', 'absent')
);

DROP POLICY IF EXISTS "Students can delete own status" ON public.student_status;
CREATE POLICY "Students can delete own status"
ON public.student_status
FOR DELETE
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can delete assigned student status" ON public.student_status;
CREATE POLICY "Instructors can delete assigned student status"
ON public.student_status
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND public.can_instructor_access_student(auth.uid(), student_id)
);

-- 4. Revoke anon access to internal tables
REVOKE ALL ON public.attendance_reminder_sent FROM anon;
REVOKE ALL ON public.attendance_inclass_reminder_sent FROM anon;
REVOKE ALL ON public.user_onboarding FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_onboarding TO authenticated;
GRANT ALL ON public.attendance_reminder_sent TO service_role;
GRANT ALL ON public.attendance_inclass_reminder_sent TO service_role;
GRANT ALL ON public.user_onboarding TO service_role;

-- 5. Revoke public/anon EXECUTE on SECURITY DEFINER functions
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
  END LOOP;
END
$$;
