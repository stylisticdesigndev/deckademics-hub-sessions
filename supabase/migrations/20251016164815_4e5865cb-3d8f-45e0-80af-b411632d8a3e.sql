-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create student_notes table for organized note-taking with notifications
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_notes
CREATE POLICY "Instructors can insert notes for their students"
ON public.student_notes
FOR INSERT
TO authenticated
WITH CHECK (
  instructor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.students
    WHERE id = student_id AND instructor_id = auth.uid()
  )
);

CREATE POLICY "Instructors can view their own notes"
ON public.student_notes
FOR SELECT
TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Students can view their own notes"
ON public.student_notes
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can update only is_read field"
ON public.student_notes
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can manage all notes"
ON public.student_notes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_student_notes_student_id ON public.student_notes(student_id);
CREATE INDEX idx_student_notes_created_at ON public.student_notes(created_at DESC);
CREATE INDEX idx_student_notes_is_read ON public.student_notes(student_id, is_read);

-- Add trigger for updated_at
CREATE TRIGGER update_student_notes_updated_at
BEFORE UPDATE ON public.student_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for student_notes table
ALTER TABLE public.student_notes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_notes;