-- Drop the 1-10 check constraint and allow 0-100 range for storing raw percentages
ALTER TABLE public.student_progress DROP CONSTRAINT student_progress_proficiency_check;
ALTER TABLE public.student_progress ADD CONSTRAINT student_progress_proficiency_check CHECK (proficiency >= 0 AND proficiency <= 100);