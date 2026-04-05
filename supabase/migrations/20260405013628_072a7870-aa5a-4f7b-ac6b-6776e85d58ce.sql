CREATE POLICY "Admins can view all student progress"
ON public.student_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));