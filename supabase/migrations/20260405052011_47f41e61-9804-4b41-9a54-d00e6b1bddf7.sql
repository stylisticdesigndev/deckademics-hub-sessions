-- Add foreign key from payments.student_id to profiles.id so PostgREST can resolve the join
ALTER TABLE public.payments
  ADD CONSTRAINT payments_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;