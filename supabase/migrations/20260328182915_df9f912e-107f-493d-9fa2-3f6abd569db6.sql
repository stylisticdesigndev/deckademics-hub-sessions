CREATE POLICY "Students can view their own progress"
  ON public.student_progress
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());