
CREATE OR REPLACE FUNCTION public.notify_admins_new_bug_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  reporter_name TEXT;
  notifications_on BOOLEAN;
BEGIN
  SELECT notifications_enabled INTO notifications_on FROM public.app_settings LIMIT 1;
  IF notifications_on IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') INTO reporter_name
  FROM public.profiles WHERE id = NEW.reporter_id;

  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.admin_notifications (admin_id, type, title, message)
    VALUES (
      admin_record.user_id,
      'bug_report',
      'New Bug Report',
      TRIM(reporter_name) || ' (' || NEW.reporter_role || ') reported: ' || NEW.title
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_bug_report
AFTER INSERT ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_bug_report();
