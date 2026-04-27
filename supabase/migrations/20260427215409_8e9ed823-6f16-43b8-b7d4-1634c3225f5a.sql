-- Add is_mock flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_mock ON public.profiles(is_mock);

-- Add global "hide mock users" setting on app_settings
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS hide_mock_users BOOLEAN NOT NULL DEFAULT false;

-- Allow admins to bulk-purge mock users via a security definer function
CREATE OR REPLACE FUNCTION public.delete_all_mock_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  mock_ids uuid[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete mock users';
  END IF;

  SELECT ARRAY(SELECT id FROM public.profiles WHERE is_mock = true) INTO mock_ids;

  IF array_length(mock_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('deleted', 0);
  END IF;

  -- Clean up dependent rows that don't have ON DELETE CASCADE to auth.users
  DELETE FROM public.students WHERE id = ANY(mock_ids);
  DELETE FROM public.instructors WHERE id = ANY(mock_ids);
  DELETE FROM public.user_roles WHERE user_id = ANY(mock_ids);
  DELETE FROM public.notification_preferences WHERE user_id = ANY(mock_ids);
  DELETE FROM public.admin_notifications WHERE admin_id = ANY(mock_ids);
  DELETE FROM public.announcement_reads WHERE user_id = ANY(mock_ids);
  DELETE FROM public.messages WHERE sender_id = ANY(mock_ids) OR receiver_id = ANY(mock_ids);
  DELETE FROM public.student_notes WHERE student_id = ANY(mock_ids) OR instructor_id = ANY(mock_ids);
  DELETE FROM public.student_personal_notes WHERE student_id = ANY(mock_ids);
  DELETE FROM public.student_tasks WHERE student_id = ANY(mock_ids) OR instructor_id = ANY(mock_ids);
  DELETE FROM public.student_makeups WHERE student_id = ANY(mock_ids) OR instructor_id = ANY(mock_ids);
  DELETE FROM public.student_absences WHERE student_id = ANY(mock_ids);
  DELETE FROM public.student_status WHERE student_id = ANY(mock_ids);
  DELETE FROM public.attendance WHERE student_id = ANY(mock_ids);
  DELETE FROM public.payments WHERE student_id = ANY(mock_ids);
  DELETE FROM public.instructor_ledger_entries WHERE instructor_id = ANY(mock_ids) OR student_id = ANY(mock_ids);
  DELETE FROM public.instructor_payment_extras WHERE instructor_id = ANY(mock_ids);
  DELETE FROM public.instructor_payments WHERE instructor_id = ANY(mock_ids);
  DELETE FROM public.instructor_schedules WHERE instructor_id = ANY(mock_ids);
  DELETE FROM public.schedule_change_requests WHERE requested_by = ANY(mock_ids) OR student_id = ANY(mock_ids);
  DELETE FROM public.bug_reports WHERE reporter_id = ANY(mock_ids);
  DELETE FROM public.feature_requests WHERE requester_id = ANY(mock_ids);
  DELETE FROM public.enrollments WHERE student_id = ANY(mock_ids);
  DELETE FROM public.profiles WHERE id = ANY(mock_ids);

  -- Finally remove auth users
  DELETE FROM auth.users WHERE id = ANY(mock_ids);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN jsonb_build_object('deleted', array_length(mock_ids, 1));
END;
$$;

-- Bulk-flag helper
CREATE OR REPLACE FUNCTION public.set_mock_flag(_user_ids uuid[], _is_mock boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can flag mock users';
  END IF;

  UPDATE public.profiles
  SET is_mock = _is_mock, updated_at = now()
  WHERE id = ANY(_user_ids);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN jsonb_build_object('updated', updated_count);
END;
$$;