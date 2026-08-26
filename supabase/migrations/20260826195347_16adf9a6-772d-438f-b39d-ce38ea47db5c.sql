
-- Instructors: add WITH CHECK to self-update policy
DROP POLICY IF EXISTS "Instructors can update their own information" ON public.instructors;
CREATE POLICY "Instructors can update their own information"
ON public.instructors
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent instructors from changing privileged columns on their own row
CREATE OR REPLACE FUNCTION public.protect_instructor_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = NEW.id THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Instructors cannot change their own status';
    END IF;
    IF NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate THEN
      RAISE EXCEPTION 'Instructors cannot change their own hourly rate';
    END IF;
    IF NEW.session_fee IS DISTINCT FROM OLD.session_fee THEN
      RAISE EXCEPTION 'Instructors cannot change their own session fee';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Instructors cannot change record ownership';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_instructor_privileged_fields_trg ON public.instructors;
CREATE TRIGGER protect_instructor_privileged_fields_trg
BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION public.protect_instructor_privileged_fields();

-- Students: add WITH CHECK to self-update policy
DROP POLICY IF EXISTS "Students can update their own information" ON public.students;
CREATE POLICY "Students can update their own information"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent students from changing privileged columns on their own row
CREATE OR REPLACE FUNCTION public.protect_student_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF public.can_instructor_access_student(auth.uid(), NEW.id) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = NEW.id THEN
    IF NEW.enrollment_status IS DISTINCT FROM OLD.enrollment_status THEN
      RAISE EXCEPTION 'Students cannot change their own enrollment status';
    END IF;
    IF NEW.instructor_id IS DISTINCT FROM OLD.instructor_id THEN
      RAISE EXCEPTION 'Students cannot change their assigned instructor';
    END IF;
    IF NEW.class_day IS DISTINCT FROM OLD.class_day
       OR NEW.class_time IS DISTINCT FROM OLD.class_time
       OR NEW.class_room IS DISTINCT FROM OLD.class_room THEN
      RAISE EXCEPTION 'Students cannot change their own class schedule';
    END IF;
    IF NEW.level IS DISTINCT FROM OLD.level THEN
      RAISE EXCEPTION 'Students cannot change their own level';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Students cannot change record ownership';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_student_privileged_fields_trg ON public.students;
CREATE TRIGGER protect_student_privileged_fields_trg
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.protect_student_privileged_fields();
