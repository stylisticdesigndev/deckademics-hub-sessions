CREATE POLICY "Students can view instructor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'instructor'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.students s 
    WHERE s.id = auth.uid() 
    AND s.instructor_id = profiles.id
  )
);