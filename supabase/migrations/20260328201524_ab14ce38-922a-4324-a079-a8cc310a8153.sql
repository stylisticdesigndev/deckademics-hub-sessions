CREATE POLICY "Instructors can update their own notes"
ON public.student_notes
FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());