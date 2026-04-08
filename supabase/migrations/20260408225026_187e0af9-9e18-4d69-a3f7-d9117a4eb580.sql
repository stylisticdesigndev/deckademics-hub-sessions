
-- Add schedule columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS class_day text,
  ADD COLUMN IF NOT EXISTS class_time text;

-- Create schedule_change_requests table (using prev_ prefix to avoid reserved words)
CREATE TABLE public.schedule_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prev_day text,
  prev_time text,
  new_day text NOT NULL,
  new_time text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.schedule_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can insert schedule requests"
  ON public.schedule_change_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    has_role(auth.uid(), 'instructor'::app_role) AND
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.instructor_id = auth.uid())
  );

CREATE POLICY "Instructors can view own requests"
  ON public.schedule_change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Admins can manage all schedule requests"
  ON public.schedule_change_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
