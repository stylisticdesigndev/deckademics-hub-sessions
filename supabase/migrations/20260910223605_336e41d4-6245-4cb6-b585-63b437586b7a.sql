CREATE POLICY "Instructors can view all student notes"
ON public.student_notes
FOR SELECT
TO authenticated
USING (public.get_profile_role(auth.uid()) = 'instructor'::user_role);