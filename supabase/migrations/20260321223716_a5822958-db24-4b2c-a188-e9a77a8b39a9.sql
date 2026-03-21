
-- 1. Add admin guard to get_all_users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email text, first_name text, last_name text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  RETURN QUERY SELECT p.id, p.email, p.first_name, p.last_name, p.role::text FROM public.profiles p;
END;
$$;

-- 2. Fix is_admin() to use user_roles via has_role instead of profiles.role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

-- 3. Fix admin_create_instructor to use has_role instead of profiles.role
CREATE OR REPLACE FUNCTION public.admin_create_instructor(user_id uuid, initial_status text, initial_hourly_rate numeric)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can create instructor records';
  END IF;

  IF EXISTS (SELECT 1 FROM public.instructors WHERE id = user_id) THEN
    RAISE EXCEPTION 'Instructor record already exists for this user';
  END IF;

  INSERT INTO public.instructors (id, status, specialties, hourly_rate, years_experience)
  VALUES (user_id, initial_status, ARRAY[]::TEXT[], initial_hourly_rate, 0)
  RETURNING jsonb_build_object('id', id, 'status', status, 'hourly_rate', hourly_rate) INTO result;

  RETURN result;
END;
$$;

-- 4. Drop duplicate profile UPDATE policies, create restricted one that prevents role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()));

-- 5. Fix get_user_role search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'admin'::app_role) THEN 'admin'::user_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'instructor'::app_role) THEN 'instructor'::user_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'student'::app_role) THEN 'student'::user_role
    ELSE 'student'::user_role
  END;
$$;
