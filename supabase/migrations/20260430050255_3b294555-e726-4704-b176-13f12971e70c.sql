-- Add dj_name column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dj_name text;

-- Update handle_new_user to capture dj_name from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  role_value text;
  first_name_value text;
  last_name_value text;
  dj_name_value text;
  email_value text;
  target_role app_role;
BEGIN
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  first_name_value := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_value := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  dj_name_value := NULLIF(NEW.raw_user_meta_data->>'dj_name', '');
  email_value := COALESCE(NEW.email, '');

  target_role := CASE
    WHEN role_value = 'admin' THEN 'admin'::app_role
    WHEN role_value = 'instructor' THEN 'instructor'::app_role
    WHEN role_value = 'student' THEN 'student'::app_role
    ELSE 'student'::app_role
  END;

  INSERT INTO public.profiles (id, email, first_name, last_name, dj_name, role)
  VALUES (
    NEW.id,
    email_value,
    first_name_value,
    last_name_value,
    dj_name_value,
    CASE
      WHEN target_role = 'admin'::app_role THEN 'admin'::user_role
      WHEN target_role = 'instructor'::app_role THEN 'instructor'::user_role
      WHEN target_role = 'student'::app_role THEN 'student'::user_role
      ELSE 'student'::user_role
    END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, target_role);

  IF (target_role = 'student'::app_role) THEN
    INSERT INTO public.students (id) VALUES (NEW.id);
  END IF;

  IF (target_role = 'instructor'::app_role) THEN
    INSERT INTO public.instructors (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;