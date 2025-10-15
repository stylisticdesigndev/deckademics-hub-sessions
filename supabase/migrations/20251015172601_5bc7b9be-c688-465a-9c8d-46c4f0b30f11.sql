-- Fix security issues: Add RLS policies to tables without them

-- Payments table: Only admins can manage, students can view their own
CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Instructor payments table: Admins and instructors can view their own
CREATE POLICY "Admins can manage all instructor payments"
ON public.instructor_payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can view their own payments"
ON public.instructor_payments FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

-- Attendance table: Admins and instructors can manage, students can view their own
CREATE POLICY "Admins can manage all attendance"
ON public.attendance FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage attendance"
ON public.attendance FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'instructor') AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance.class_id AND c.instructor_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'instructor') AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = attendance.class_id AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Enrollments table: Admins manage, students view their own, instructors view their classes
CREATE POLICY "Admins can manage all enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view enrollments for their classes"
ON public.enrollments FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'instructor') AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = enrollments.class_id AND c.instructor_id = auth.uid()
  )
);

-- Fix function search_path issues: Add SET search_path to security definer functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT (role = 'admin')::boolean 
  FROM public.profiles 
  WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile(user_id uuid)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT * FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_students_with_instructors(student_ids uuid[])
RETURNS TABLE(student_id uuid, instructor_id uuid, instructor_first_name text, instructor_last_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    i.id AS instructor_id,
    p.first_name AS instructor_first_name,
    p.last_name AS instructor_last_name
  FROM 
    students s
  LEFT JOIN (
    SELECT 
      student_id AS sid,
      instructor_id AS iid
    FROM (
      SELECT DISTINCT
        e.student_id,
        c.instructor_id
      FROM 
        enrollments e
      JOIN 
        classes c ON e.class_id = c.id
      WHERE 
        c.instructor_id IS NOT NULL
    ) AS student_instructor_relation
  ) AS si ON s.id = si.sid
  LEFT JOIN 
    instructors i ON si.iid = i.id
  LEFT JOIN 
    profiles p ON i.id = p.id
  WHERE 
    s.id = ANY($1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_student_counts()
RETURNS TABLE(total integer, pending integer, active integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  active_count int;
  pending_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.students WHERE enrollment_status = 'active';
  SELECT COUNT(*) INTO pending_count FROM public.students WHERE enrollment_status = 'pending';
  total_count := (SELECT COUNT(*) FROM public.students);
  
  RETURN QUERY SELECT total_count, pending_count, active_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_student_to_instructor(student_id uuid, instructor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.instructors WHERE id = instructor_id AND status = 'active') THEN
    RAISE EXCEPTION 'Instructor not found or not active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND enrollment_status = 'active') THEN
    RAISE EXCEPTION 'Student not found or not active';
  END IF;
  
  UPDATE public.students
  SET instructor_id = assign_student_to_instructor.instructor_id
  WHERE id = assign_student_to_instructor.student_id
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
$function$;

CREATE OR REPLACE FUNCTION public.get_instructors_with_profiles(status_param text)
RETURNS TABLE(id uuid, status text, specialties text[], bio text, hourly_rate numeric, years_experience integer, profile jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
      'email', p.email
    ) as profile
  FROM 
    public.instructors i
  JOIN 
    public.profiles p ON i.id = p.id
  WHERE 
    i.status = status_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_instructor_counts()
RETURNS TABLE(total integer, pending integer, active integer, inactive integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  active_count int;
  pending_count int;
  inactive_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO active_count FROM public.instructors WHERE status = 'active';
  SELECT COUNT(*) INTO pending_count FROM public.instructors WHERE status = 'pending';
  SELECT COUNT(*) INTO inactive_count FROM public.instructors WHERE status = 'inactive';
  total_count := active_count + pending_count + inactive_count;
  
  RETURN QUERY SELECT total_count, pending_count, active_count, inactive_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_create_instructor(user_id uuid, initial_status text, initial_hourly_rate numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create instructor records';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.instructors WHERE id = user_id) THEN
    RAISE EXCEPTION 'Instructor record already exists for this user';
  END IF;

  INSERT INTO public.instructors (
    id,
    status,
    specialties,
    hourly_rate,
    years_experience
  ) VALUES (
    user_id,
    initial_status,
    ARRAY[]::TEXT[],
    initial_hourly_rate,
    0
  )
  RETURNING jsonb_build_object(
    'id', id,
    'status', status,
    'hourly_rate', hourly_rate
  ) INTO result;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_demo_student(student_id uuid, email_address text, first_name text, last_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role
  ) VALUES (
    student_id,
    email_address,
    first_name,
    last_name,
    'student'
  );
  
  INSERT INTO public.students (
    id,
    level,
    enrollment_status
  ) VALUES (
    student_id,
    'beginner',
    'active'
  )
  RETURNING jsonb_build_object(
    'id', id,
    'level', level,
    'enrollment_status', enrollment_status
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating demo student: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email text, first_name text, last_name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.first_name, p.last_name, p.role::text
  FROM public.profiles p;
END;
$function$;