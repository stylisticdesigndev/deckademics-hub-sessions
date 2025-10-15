-- Drop old constraints first
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_level_check;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- Update existing students to use capitalized levels
UPDATE students SET level = 'Novice' WHERE level = 'beginner';
UPDATE students SET level = 'Intermediate' WHERE level = 'intermediate';
UPDATE students SET level = 'Advanced' WHERE level = 'advanced';

-- Update courses table for consistency
UPDATE courses SET level = 'Novice' WHERE level = 'beginner';
UPDATE courses SET level = 'Intermediate' WHERE level = 'intermediate';
UPDATE courses SET level = 'Advanced' WHERE level = 'advanced';

-- Add new constraints with capitalized values
ALTER TABLE students ADD CONSTRAINT students_level_check 
  CHECK (level = ANY (ARRAY['Novice'::text, 'Intermediate'::text, 'Advanced'::text]));

ALTER TABLE courses ADD CONSTRAINT courses_level_check 
  CHECK (level = ANY (ARRAY['Novice'::text, 'Intermediate'::text, 'Advanced'::text]));