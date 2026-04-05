
-- Drop old constraint first
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_level_check;

-- Normalize existing data
UPDATE public.students SET level = 'novice' WHERE level IN ('Novice', 'Beginner', 'beginner');
UPDATE public.students SET level = 'intermediate' WHERE level = 'Intermediate';
UPDATE public.students SET level = 'advanced' WHERE level = 'Advanced';
UPDATE public.students SET level = 'amateur' WHERE level = 'Amateur';

-- Update the default
ALTER TABLE public.students ALTER COLUMN level SET DEFAULT 'novice';

-- Add new constraint
ALTER TABLE public.students ADD CONSTRAINT students_level_check CHECK (level = ANY (ARRAY['novice'::text, 'amateur'::text, 'intermediate'::text, 'advanced'::text]));
