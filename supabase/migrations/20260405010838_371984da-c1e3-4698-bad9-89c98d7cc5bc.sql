
-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view their own notifications
CREATE POLICY "Admins can view own notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins can update own notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete their own notifications
CREATE POLICY "Admins can delete own notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (admin_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::app_role));

-- Allow trigger functions to insert (security definer)
CREATE POLICY "System can insert notifications"
ON public.admin_notifications
FOR INSERT
TO public
WITH CHECK (true);

-- Trigger function: notify admins on new pending student
CREATE OR REPLACE FUNCTION public.notify_admins_new_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  student_name TEXT;
  notifications_on BOOLEAN;
BEGIN
  -- Check if notifications are enabled
  SELECT notifications_enabled INTO notifications_on FROM public.app_settings LIMIT 1;
  IF notifications_on IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Only notify for pending students
  IF NEW.enrollment_status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get student name
  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') INTO student_name
  FROM public.profiles WHERE id = NEW.id;

  -- Insert notification for each admin
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.admin_notifications (admin_id, type, title, message)
    VALUES (
      admin_record.user_id,
      'new_student',
      'New Student Signup',
      TRIM(student_name) || ' has registered and is awaiting approval.'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger function: notify admins on new pending instructor
CREATE OR REPLACE FUNCTION public.notify_admins_new_instructor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  instructor_name TEXT;
  notifications_on BOOLEAN;
BEGIN
  -- Check if notifications are enabled
  SELECT notifications_enabled INTO notifications_on FROM public.app_settings LIMIT 1;
  IF notifications_on IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Only notify for pending instructors
  IF NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  -- Get instructor name
  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') INTO instructor_name
  FROM public.profiles WHERE id = NEW.id;

  -- Insert notification for each admin
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.admin_notifications (admin_id, type, title, message)
    VALUES (
      admin_record.user_id,
      'new_instructor',
      'New Instructor Signup',
      TRIM(instructor_name) || ' has registered and is awaiting approval.'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach triggers
CREATE TRIGGER on_new_student_notify_admins
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_student();

CREATE TRIGGER on_new_instructor_notify_admins
AFTER INSERT ON public.instructors
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_instructor();
