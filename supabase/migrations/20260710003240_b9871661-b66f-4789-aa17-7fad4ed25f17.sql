CREATE TABLE public.attendance_reminder_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL,
  class_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, class_date)
);

GRANT ALL ON public.attendance_reminder_sent TO service_role;

ALTER TABLE public.attendance_reminder_sent ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: this bookkeeping table is only ever
-- written and read by the scheduled edge function using the service role.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;