CREATE OR REPLACE FUNCTION public.get_messageable_students()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  two_way_messaging boolean,
  is_mine boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(s.two_way_messaging, true) AS two_way_messaging,
    (
      EXISTS (
        SELECT 1 FROM public.student_instructors si
        WHERE si.instructor_id = auth.uid() AND si.student_id = p.id
      )
      OR s.instructor_id = auth.uid()
    ) AS is_mine
  FROM public.students s
  JOIN public.profiles p ON p.id = s.id
  WHERE s.enrollment_status = 'active'
    AND COALESCE(p.is_mock, false) = false
    AND (
      public.has_role(auth.uid(), 'instructor'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    );
$function$;

GRANT EXECUTE ON FUNCTION public.get_messageable_students() TO authenticated;