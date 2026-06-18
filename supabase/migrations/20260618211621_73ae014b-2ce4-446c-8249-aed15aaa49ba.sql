
CREATE OR REPLACE FUNCTION public.get_instructor_display_names()
RETURNS TABLE(id uuid, dj_name text, first_name text, last_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.dj_name, p.first_name, p.last_name, p.avatar_url
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'instructor'::app_role
  WHERE public.has_role(auth.uid(), 'instructor'::app_role)
     OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_instructor_display_names() TO authenticated;
