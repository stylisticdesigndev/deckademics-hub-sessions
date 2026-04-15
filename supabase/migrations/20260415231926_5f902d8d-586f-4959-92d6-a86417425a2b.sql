
-- 1. Add admin guard to get_instructors_with_profiles
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
      'avatar_url', p.avatar_url
    ) as profile
  FROM 
    public.instructors i
  JOIN 
    public.profiles p ON i.id = p.id
  WHERE 
    i.status = status_param;
END;
$function$;

-- 2. Replace broad instructors SELECT policy with restricted one
DROP POLICY IF EXISTS "Authenticated users can view instructors" ON public.instructors;

CREATE POLICY "Authenticated users can view basic instructor info"
ON public.instructors
FOR SELECT
TO authenticated
USING (
  -- Admins see everything (via existing admin policy)
  -- Instructors can see their own record
  (auth.uid() = id)
  OR
  -- Students can see their assigned instructor's non-sensitive info
  (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = auth.uid() AND s.instructor_id = instructors.id
  ))
);

-- 3. Fix curriculum_modules policies: change from PUBLIC to AUTHENTICATED
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.curriculum_modules;
DROP POLICY IF EXISTS "Instructors can view modules" ON public.curriculum_modules;
DROP POLICY IF EXISTS "Students can view modules" ON public.curriculum_modules;

CREATE POLICY "Admins can manage all modules"
ON public.curriculum_modules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view modules"
ON public.curriculum_modules
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Students can view modules"
ON public.curriculum_modules
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- 4. Fix curriculum_lessons policies: change from PUBLIC to AUTHENTICATED
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.curriculum_lessons;
DROP POLICY IF EXISTS "Instructors can view lessons" ON public.curriculum_lessons;
DROP POLICY IF EXISTS "Students can view lessons" ON public.curriculum_lessons;

CREATE POLICY "Admins can manage all lessons"
ON public.curriculum_lessons
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view lessons"
ON public.curriculum_lessons
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Students can view lessons"
ON public.curriculum_lessons
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'student'::app_role));

-- 5. Add BEFORE UPDATE trigger to prevent role escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins to change roles
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, prevent role changes
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Permission denied: cannot change own role';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();
