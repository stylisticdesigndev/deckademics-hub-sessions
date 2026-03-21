
-- Fix overly broad instructor update policy on students table
DROP POLICY IF EXISTS "Instructors can update assigned student notes" ON students;
CREATE POLICY "Instructors can update assigned students" ON students FOR UPDATE TO authenticated
USING (instructor_id = auth.uid());
