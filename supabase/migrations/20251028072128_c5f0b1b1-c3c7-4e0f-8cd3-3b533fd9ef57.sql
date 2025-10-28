-- Recreate the handle_new_user function to recognize the app_role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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