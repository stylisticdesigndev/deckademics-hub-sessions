
-- Create a function to assign a student to an instructor
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
  SET instructor_id = instructor_id
  WHERE id = student_id
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
