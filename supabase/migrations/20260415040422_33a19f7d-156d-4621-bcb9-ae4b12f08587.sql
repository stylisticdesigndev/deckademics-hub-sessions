
-- Add order_index column for drag-and-drop reordering
ALTER TABLE public.student_tasks 
ADD COLUMN order_index integer NOT NULL DEFAULT 0;

-- Set initial order_index based on created_at for existing rows
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at ASC) - 1 AS rn
  FROM public.student_tasks
)
UPDATE public.student_tasks t
SET order_index = r.rn
FROM ranked r
WHERE t.id = r.id;
