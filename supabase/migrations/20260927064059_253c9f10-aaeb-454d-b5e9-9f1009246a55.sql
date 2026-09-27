DROP POLICY "Courses viewable by authenticated" ON public.courses;
CREATE POLICY "Courses viewable by school members" ON public.courses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'instructor') OR public.has_role(auth.uid(),'student'));

DROP POLICY "Classes viewable by authenticated" ON public.classes;
CREATE POLICY "Classes viewable by school members" ON public.classes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'instructor') OR public.has_role(auth.uid(),'student'));

DROP POLICY "Announcements viewable by authenticated" ON public.announcements;
CREATE POLICY "Announcements viewable by target role" ON public.announcements FOR SELECT TO authenticated
USING (public.is_admin() OR author_id = auth.uid()
  OR target_role IS NULL OR cardinality(target_role) = 0
  OR public.get_user_role(auth.uid()) = ANY(target_role));

DROP POLICY "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Users can view own avatar files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND owner_id = (select auth.uid()::text));

DROP POLICY "Public read for background videos" ON storage.objects;
CREATE POLICY "Admins can list background videos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'background-videos' AND public.is_admin());

DROP POLICY "Anyone can view bug screenshots" ON storage.objects;
CREATE POLICY "Admins can list bug screenshots" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bug-screenshots' AND public.is_admin());

DROP POLICY "Feature screenshots are publicly accessible" ON storage.objects;
CREATE POLICY "Admins can list feature screenshots" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'feature-screenshots' AND public.is_admin());