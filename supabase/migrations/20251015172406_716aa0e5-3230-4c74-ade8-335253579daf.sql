-- Step 1: Create the app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');

-- Step 2: Create the user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Add RLS policies to user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Insert profile for the new admin user
INSERT INTO public.profiles (id, email, first_name, last_name, role)
VALUES (
  'a3ccc05d-1304-417b-bc5b-2958621be5b8',
  'whadhannen@gmail.com',
  'Admin',
  'User',
  'admin'::user_role
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- Step 6: Insert admin role in user_roles table
INSERT INTO public.user_roles (user_id, role)
VALUES ('a3ccc05d-1304-417b-bc5b-2958621be5b8', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 7: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 
       CASE 
         WHEN role::text = 'admin' THEN 'admin'::app_role
         WHEN role::text = 'instructor' THEN 'instructor'::app_role
         WHEN role::text = 'student' THEN 'student'::app_role
         ELSE 'student'::app_role
       END
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 8: Update get_user_role() function to use user_roles table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'admin'::app_role) THEN 'admin'::user_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'instructor'::app_role) THEN 'instructor'::user_role
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = get_user_role.user_id AND role = 'student'::app_role) THEN 'student'::user_role
    ELSE 'student'::user_role
  END;
$function$;

-- Step 9: Fix handle_new_user() trigger to create entries in user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  role_value text;
  first_name_value text;
  last_name_value text;
  email_value text;
  target_role app_role;
BEGIN
  -- Get values from user metadata with better null handling
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  first_name_value := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_value := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  email_value := COALESCE(NEW.email, '');
  
  -- Determine target role for both profiles and user_roles
  target_role := CASE 
    WHEN role_value = 'admin' THEN 'admin'::app_role
    WHEN role_value = 'instructor' THEN 'instructor'::app_role
    WHEN role_value = 'student' THEN 'student'::app_role
    ELSE 'student'::app_role
  END;
  
  -- Insert into profiles with proper role casting
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    email_value,
    first_name_value,
    last_name_value,
    CASE 
      WHEN target_role = 'admin'::app_role THEN 'admin'::user_role
      WHEN target_role = 'instructor'::app_role THEN 'instructor'::user_role
      WHEN target_role = 'student'::app_role THEN 'student'::user_role
      ELSE 'student'::user_role
    END
  );
  
  -- Insert into user_roles table (new secure system)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, target_role);
  
  -- If user is a student, add to students table
  IF (target_role = 'student'::app_role) THEN
    INSERT INTO public.students (id)
    VALUES (NEW.id);
  END IF;
  
  -- If user is an instructor, add to instructors table
  IF (target_role = 'instructor'::app_role) THEN
    INSERT INTO public.instructors (id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;