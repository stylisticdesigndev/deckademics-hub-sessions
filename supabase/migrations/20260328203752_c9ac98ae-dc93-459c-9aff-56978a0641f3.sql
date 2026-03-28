
CREATE TABLE public.student_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  instructor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- Instructors can CRUD their own tasks
CREATE POLICY "Instructors can manage their own tasks"
  ON public.student_tasks FOR ALL
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Students can view their own tasks
CREATE POLICY "Students can view their own tasks"
  ON public.student_tasks FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can update their own tasks (mark complete)
CREATE POLICY "Students can update their own tasks"
  ON public.student_tasks FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Admins can manage all tasks
CREATE POLICY "Admins can manage all tasks"
  ON public.student_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_student_tasks_updated_at
  BEFORE UPDATE ON public.student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
