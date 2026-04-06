-- 1. Remove blanket storage policy
DROP POLICY IF EXISTS "Public access to all buckets" ON storage.objects;

-- 2. Fix instructor public exposure
DROP POLICY IF EXISTS "Instructors are viewable by everyone" ON public.instructors;
DROP POLICY IF EXISTS "Instructors can view and update their own records" ON public.instructors;
CREATE POLICY "Authenticated users can view instructors" ON public.instructors
  FOR SELECT TO authenticated USING (true);

-- 3. Remove public admin notification insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- 4. Remove blanket profile insert
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON public.profiles;