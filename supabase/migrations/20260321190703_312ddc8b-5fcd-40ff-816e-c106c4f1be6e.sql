
-- Create student_absences table for student-initiated absence requests
CREATE TABLE public.student_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  absence_date date NOT NULL,
  reason text,
  notified_instructor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, absence_date)
);

-- Enable RLS
ALTER TABLE public.student_absences ENABLE ROW LEVEL SECURITY;

-- Students can insert their own absences
CREATE POLICY "Students can insert their own absences"
ON public.student_absences
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can view their own absences
CREATE POLICY "Students can view their own absences"
ON public.student_absences
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Instructors can view absences for their classes
CREATE POLICY "Instructors can view absences for their classes"
ON public.student_absences
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = student_absences.class_id
    AND c.instructor_id = auth.uid()
  )
);

-- Admins can manage all absences
CREATE POLICY "Admins can manage all absences"
ON public.student_absences
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
