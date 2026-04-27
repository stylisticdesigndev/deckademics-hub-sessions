CREATE TABLE public.student_makeups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  absence_date date NOT NULL,
  makeup_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, absence_date)
);

ALTER TABLE public.student_makeups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all makeups"
ON public.student_makeups
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors manage their own makeups"
ON public.student_makeups
FOR ALL TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Students view their own makeups"
ON public.student_makeups
FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE TRIGGER trg_student_makeups_updated_at
BEFORE UPDATE ON public.student_makeups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_student_makeups_instructor ON public.student_makeups(instructor_id);
CREATE INDEX idx_student_makeups_student ON public.student_makeups(student_id);