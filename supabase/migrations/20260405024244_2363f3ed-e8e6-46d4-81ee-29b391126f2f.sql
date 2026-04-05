
CREATE TABLE public.progress_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL DEFAULT 'novice',
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all progress skills"
  ON public.progress_skills FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view progress skills"
  ON public.progress_skills FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Students can view progress skills"
  ON public.progress_skills FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'student'::app_role));

CREATE TRIGGER update_progress_skills_updated_at
  BEFORE UPDATE ON public.progress_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
