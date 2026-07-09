-- 1. Add Core/Creative flag to progress_skills
ALTER TABLE public.progress_skills
  ADD COLUMN IF NOT EXISTS is_core boolean NOT NULL DEFAULT true;

-- 2. Convert existing student_progress proficiency (0-100) to 3-point milestone (0-3)
-- Drop old check constraint if present, remap values, then add new constraint.
ALTER TABLE public.student_progress
  DROP CONSTRAINT IF EXISTS student_progress_proficiency_check;

UPDATE public.student_progress
SET proficiency = CASE
  WHEN proficiency IS NULL THEN NULL
  WHEN proficiency <= 0 THEN 0
  WHEN proficiency < 50 THEN 1
  WHEN proficiency < 85 THEN 2
  ELSE 3
END
WHERE proficiency IS NOT NULL AND proficiency > 3;

ALTER TABLE public.student_progress
  ADD CONSTRAINT student_progress_proficiency_check
  CHECK (proficiency >= 0 AND proficiency <= 3);