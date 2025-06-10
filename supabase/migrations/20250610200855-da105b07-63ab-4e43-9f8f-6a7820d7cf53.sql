
-- Add instructor_id column to students table to establish the relationship
ALTER TABLE public.students 
ADD COLUMN instructor_id UUID REFERENCES public.instructors(id);

-- Update the assign_student_to_instructor function to work correctly with the new schema
CREATE OR REPLACE FUNCTION public.assign_student_to_instructor(
  student_id UUID,
  instructor_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if the instructor exists and is active
  IF NOT EXISTS (SELECT 1 FROM public.instructors WHERE id = instructor_id AND status = 'active') THEN
    RAISE EXCEPTION 'Instructor not found or not active';
  END IF;
  
  -- Check if the student exists and is active
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND enrollment_status = 'active') THEN
    RAISE EXCEPTION 'Student not found or not active';
  END IF;
  
  -- Update the student record to assign the instructor
  UPDATE public.students
  SET instructor_id = assign_student_to_instructor.instructor_id
  WHERE id = assign_student_to_instructor.student_id
  RETURNING jsonb_build_object(
    'id', id,
    'instructor_id', instructor_id,
    'updated_at', now()
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error assigning student to instructor: %', SQLERRM;
END;
$$;
