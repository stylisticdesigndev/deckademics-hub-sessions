REVOKE ALL ON public.instructor_programs FROM anon,PUBLIC;
ALTER FUNCTION public.is_production_instructor(uuid) SECURITY INVOKER;
DROP POLICY instructor_program_admin ON public.instructor_programs;
CREATE POLICY instructor_program_admin_insert ON public.instructor_programs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY instructor_program_admin_update ON public.instructor_programs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY instructor_program_admin_delete ON public.instructor_programs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));