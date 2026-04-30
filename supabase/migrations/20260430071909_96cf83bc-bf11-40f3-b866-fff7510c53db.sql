
CREATE POLICY "Students can delete their own absences"
ON public.attendance FOR DELETE
TO authenticated
USING (student_id = auth.uid() AND status = 'absent');

CREATE POLICY "Students can delete their own absence records"
ON public.student_absences FOR DELETE
TO authenticated
USING (student_id = auth.uid());
