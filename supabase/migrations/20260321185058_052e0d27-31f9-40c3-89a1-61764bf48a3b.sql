
-- Drop the existing CHECK constraint
ALTER TABLE public.curriculum_modules DROP CONSTRAINT IF EXISTS curriculum_modules_level_check;

-- Migrate existing 'beginner' rows to 'novice' BEFORE adding new constraint
UPDATE public.curriculum_modules SET level = 'novice' WHERE level = 'beginner';

-- Add new CHECK constraint with four levels
ALTER TABLE public.curriculum_modules ADD CONSTRAINT curriculum_modules_level_check 
  CHECK (level IN ('novice', 'amateur', 'intermediate', 'advanced'));
