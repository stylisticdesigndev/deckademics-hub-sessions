DROP FUNCTION IF EXISTS public.assign_student_to_instructor(uuid, uuid);

CREATE FUNCTION public.assign_student_to_instructor(_student_id uuid, _instructor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can assign students to instructors';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.instructors i WHERE i.id = _instructor_id AND i.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Instructor not found or not active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.enrollment_status = 'active'
  ) THEN
    RAISE EXCEPTION 'Student not found or not active';
  END IF;

  UPDATE public.students AS s
  SET instructor_id = _instructor_id
  WHERE s.id = _student_id
  RETURNING jsonb_build_object('id', s.id, 'instructor_id', s.instructor_id, 'updated_at', now()) INTO result;

  RETURN COALESCE(result, '{"error":"no rows updated"}'::jsonb);
END;
$function$;