
-- Enable RLS on student_progress table if not already enabled
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Allow instructors to insert progress records for their assigned students
CREATE POLICY "Instructors can insert progress for their students" 
  ON public.student_progress 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_progress.student_id 
      AND s.instructor_id = auth.uid()
    )
  );

-- Allow instructors to view progress records for their assigned students
CREATE POLICY "Instructors can view progress for their students" 
  ON public.student_progress 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_progress.student_id 
      AND s.instructor_id = auth.uid()
    )
  );

-- Allow instructors to update progress records for their assigned students
CREATE POLICY "Instructors can update progress for their students" 
  ON public.student_progress 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_progress.student_id 
      AND s.instructor_id = auth.uid()
    )
  );

-- Allow instructors to delete progress records for their assigned students
CREATE POLICY "Instructors can delete progress for their students" 
  ON public.student_progress 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_progress.student_id 
      AND s.instructor_id = auth.uid()
    )
  );
