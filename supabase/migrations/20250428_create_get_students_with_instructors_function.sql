
-- Function to get students with their assigned instructors
CREATE OR REPLACE FUNCTION public.get_students_with_instructors(student_ids uuid[])
RETURNS TABLE(
  student_id uuid,
  instructor_id uuid,
  instructor_first_name text,
  instructor_last_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    i.id AS instructor_id,
    p.first_name AS instructor_first_name,
    p.last_name AS instructor_last_name
  FROM 
    students s
  LEFT JOIN (
    -- This subquery simulates a junction table relationship.
    -- In a real application, you would have a proper junction table
    -- If you do have a students_instructors table, replace this with that table
    SELECT 
      student_id AS sid,
      instructor_id AS iid
    FROM (
      -- This is where we would query the junction table.
      -- As a fallback, we're selecting from a different table with a relationship
      -- For example, from classes or enrollments that might connect students to instructors
      SELECT DISTINCT
        e.student_id,
        c.instructor_id
      FROM 
        enrollments e
      JOIN 
        classes c ON e.class_id = c.id
      WHERE 
        c.instructor_id IS NOT NULL
    ) AS student_instructor_relation
  ) AS si ON s.id = si.sid
  LEFT JOIN 
    instructors i ON si.iid = i.id
  LEFT JOIN 
    profiles p ON i.id = p.id
  WHERE 
    s.id = ANY($1);
END;
$$;

-- Grant usage to authenticated users (adjust as needed for your security model)
GRANT EXECUTE ON FUNCTION public.get_students_with_instructors(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_students_with_instructors(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_students_with_instructors(uuid[]) TO anon;
