-- Remove student_notes from Realtime publication (closes authorization gap)
ALTER PUBLICATION supabase_realtime DROP TABLE public.student_notes;

-- Remove instructor access to student personal notes (privacy fix)
DROP POLICY "Instructors can view assigned student personal notes" ON public.student_personal_notes;