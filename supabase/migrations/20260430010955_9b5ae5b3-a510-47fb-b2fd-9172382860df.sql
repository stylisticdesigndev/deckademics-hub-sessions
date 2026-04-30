CREATE POLICY "Students can mark themselves absent"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND status = 'absent');