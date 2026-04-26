-- Feature requests table (separate from bug_reports)
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  requester_role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  device_type TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  seen_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feature requests"
  ON public.feature_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can view own feature requests"
  ON public.feature_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "Admins can manage all feature requests"
  ON public.feature_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins on new feature request
CREATE OR REPLACE FUNCTION public.notify_admins_new_feature_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  requester_name TEXT;
  notifications_on BOOLEAN;
BEGIN
  SELECT notifications_enabled INTO notifications_on FROM public.app_settings LIMIT 1;
  IF notifications_on IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') INTO requester_name
  FROM public.profiles WHERE id = NEW.requester_id;

  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.admin_notifications (admin_id, type, title, message)
    VALUES (
      admin_record.user_id,
      'feature_request',
      'New Feature Request',
      TRIM(requester_name) || ' (' || NEW.requester_role || ') suggested: ' || NEW.title
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_feature_request
  AFTER INSERT ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_feature_request();

-- Storage bucket for optional screenshots/mockups
INSERT INTO storage.buckets (id, name, public)
VALUES ('feature-screenshots', 'feature-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Feature screenshots are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feature-screenshots');

CREATE POLICY "Authenticated users can upload feature screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feature-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);