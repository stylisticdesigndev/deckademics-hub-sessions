
-- 1) Prevent students from editing anything but the read status on their notes
CREATE OR REPLACE FUNCTION public.enforce_student_note_read_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Admins may edit freely
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- The owning instructor may edit freely
  IF NEW.instructor_id = auth.uid() AND OLD.instructor_id = auth.uid() THEN
    RETURN NEW;
  END IF;
  -- Everyone else (students) may only change is_read
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.content IS DISTINCT FROM OLD.content
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.instructor_id IS DISTINCT FROM OLD.instructor_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Students may only update the read status of a note';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_note_read_only ON public.student_notes;
CREATE TRIGGER trg_enforce_student_note_read_only
  BEFORE UPDATE ON public.student_notes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_student_note_read_only();

-- 2) Restrict message attachment reads to the message participants (+ admins)
DROP POLICY IF EXISTS "Authenticated users can view message attachments" ON storage.objects;
CREATE POLICY "Message participants can view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
        AND m.image_url LIKE '%' || storage.objects.name
    )
  )
);

-- 3) Remove anonymous (pre-sign-in) access to all public tables.
--    The app never reads data before authentication, so anon needs no table access.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.tablename);
  END LOOP;
END $$;

-- 4) Remove anonymous EXECUTE on every SECURITY DEFINER / public function.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- 5) Trigger-only SECURITY DEFINER functions are never meant to be called
--    directly by clients. Triggers fire regardless of EXECUTE grants, so remove
--    direct-call access from signed-in users too.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_bug_report() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_feature_request() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_instructor() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_new_student() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_two_way_messaging() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.attendance_to_ledger() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_user_passkeys_on_profile_delete() FROM authenticated;
