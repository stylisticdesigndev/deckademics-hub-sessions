
-- Students: instructors can view any student record (read-only)
CREATE POLICY "Instructors can view all student records"
  ON public.students FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'instructor'::app_role));

-- Profiles: instructors can view profiles of any student (read-only)
CREATE POLICY "Instructors can view all student profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND role = 'student'::user_role
  );

-- Student-instructor links: instructors can view all assignments (to map class -> instructor)
CREATE POLICY "Instructors can view all student_instructors"
  ON public.student_instructors FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'instructor'::app_role));

-- Student progress: instructors can view all progress (read-only)
CREATE POLICY "Instructors can view all student progress"
  ON public.student_progress FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'instructor'::app_role));

-- Student notes: instructors can view all notes (read-only)
CREATE POLICY "Instructors can view all student notes"
  ON public.student_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'instructor'::app_role));
