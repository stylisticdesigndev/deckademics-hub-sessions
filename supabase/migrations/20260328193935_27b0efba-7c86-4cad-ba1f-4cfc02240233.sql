-- Create student_personal_notes table
CREATE TABLE public.student_personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_personal_notes ENABLE ROW LEVEL SECURITY;

-- Students CRUD their own notes
CREATE POLICY "Students can select own personal notes"
  ON public.student_personal_notes FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own personal notes"
  ON public.student_personal_notes FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own personal notes"
  ON public.student_personal_notes FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete own personal notes"
  ON public.student_personal_notes FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all personal notes"
  ON public.student_personal_notes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view their assigned students' notes
CREATE POLICY "Instructors can view assigned student personal notes"
  ON public.student_personal_notes FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_personal_notes.student_id
        AND s.instructor_id = auth.uid()
    )
  );

-- Update trigger
CREATE TRIGGER update_student_personal_notes_updated_at
  BEFORE UPDATE ON public.student_personal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();