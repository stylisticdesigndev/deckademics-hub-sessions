CREATE OR REPLACE FUNCTION public.get_instructors_with_profiles(status_param text)
 RETURNS TABLE(id uuid, status text, specialties text[], bio text, hourly_rate numeric, years_experience integer, profile jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    i.id,
    i.status,
    i.specialties,
    i.bio,
    i.hourly_rate,
    i.years_experience,
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'email', p.email,
      'avatar_url', p.avatar_url,
      'is_mock', p.is_mock
    ) as profile
  FROM 
    public.instructors i
  JOIN 
    public.profiles p ON i.id = p.id
  WHERE 
    i.status = status_param;
END;
$function$;