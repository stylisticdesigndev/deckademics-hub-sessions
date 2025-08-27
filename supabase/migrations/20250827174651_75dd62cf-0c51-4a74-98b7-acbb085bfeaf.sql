-- Clean up duplicate RLS policies on students table and add instructor UPDATE permission

-- First, drop duplicate policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update student information" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can view student information" ON public.students;
DROP POLICY IF EXISTS "Instructors can view student information" ON public.students;
DROP POLICY IF EXISTS "Students can view their own information" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;

-- Add the missing instructor UPDATE policy
CREATE POLICY "Instructors can update their assigned students" 
ON public.students 
FOR UPDATE 
USING (instructor_id = auth.uid());

-- Ensure instructors can also update students through RPC calls
CREATE POLICY "Instructors can update assigned student notes"
ON public.students
FOR UPDATE
USING (
  instructor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.instructors i 
    WHERE i.id = auth.uid() AND i.status = 'active'
  )
);