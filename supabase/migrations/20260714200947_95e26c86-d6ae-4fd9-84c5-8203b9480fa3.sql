-- 1. Tracking table so each reminder fires at most once per instructor/class/kind/day
CREATE TABLE IF NOT EXISTS public.attendance_inclass_reminder_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  class_date DATE NOT NULL,
  class_time TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('start', 'end')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attendance_inclass_reminder_sent_unique
    UNIQUE (instructor_id, class_date, class_time, kind)
);

GRANT ALL ON public.attendance_inclass_reminder_sent TO service_role;

ALTER TABLE public.attendance_inclass_reminder_sent ENABLE ROW LEVEL SECURITY;

-- Only service_role writes this table; no user-facing policies needed.
CREATE POLICY "Admins can view inclass reminder log"
  ON public.attendance_inclass_reminder_sent
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Ensure required extensions are enabled (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule the cron job (every 5 minutes)
DO $$
BEGIN
  -- Remove any prior schedule for this job
  PERFORM cron.unschedule('attendance-inclass-reminder-push-every-5min')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'attendance-inclass-reminder-push-every-5min'
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT
  cron.schedule(
    'attendance-inclass-reminder-push-every-5min',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
      url := 'https://qeuzosggikxwnpyhulox.supabase.co/functions/v1/attendance-inclass-reminder-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.attendance_cron_secret', true)
      ),
      body := jsonb_build_object('trigger', 'cron')
    ) AS request_id;
    $$
  );