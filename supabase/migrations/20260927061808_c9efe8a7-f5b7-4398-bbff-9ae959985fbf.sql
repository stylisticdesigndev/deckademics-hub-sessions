CREATE TABLE public.student_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_level text NOT NULL CHECK (course_level IN ('Novice','Amateur','Intermediate','Advanced')),
  certificate_id text NOT NULL UNIQUE,
  student_display_name text NOT NULL,
  instructor_name text,
  instructor_signature_url text,
  issued_date timestamptz NOT NULL DEFAULT now(),
  unseen boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_level)
);
GRANT SELECT ON public.student_certificates TO authenticated;
GRANT UPDATE (unseen) ON public.student_certificates TO authenticated;
GRANT ALL ON public.student_certificates TO service_role;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own certificates" ON public.student_certificates
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Staff view certificates" ON public.student_certificates
  FOR SELECT TO authenticated USING (public.is_admin() OR public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "Students mark own certificates seen" ON public.student_certificates
  FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.award_certificate_internal(_student_id uuid, _level text, _issued timestamptz DEFAULT now())
RETURNS public.student_certificates LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  lvl text := initcap(lower(_level));
  abbr text;
  sname text;
  iname text;
  rec public.student_certificates;
  code text;
BEGIN
  IF lvl = 'Beginner' THEN lvl := 'Novice'; END IF;
  IF lvl NOT IN ('Novice','Amateur','Intermediate','Advanced') THEN
    RAISE EXCEPTION 'Invalid level %', _level;
  END IF;
  SELECT * INTO rec FROM public.student_certificates WHERE student_id = _student_id AND course_level = lvl;
  IF FOUND THEN RETURN rec; END IF;

  abbr := CASE lvl WHEN 'Novice' THEN 'NOV' WHEN 'Amateur' THEN 'AMA' WHEN 'Intermediate' THEN 'INT' ELSE 'ADV' END;
  SELECT trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) INTO sname FROM public.profiles WHERE id = _student_id;
  SELECT coalesce(nullif(trim(p.dj_name),''), trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')))
    INTO iname FROM public.students s JOIN public.profiles p ON p.id = s.instructor_id WHERE s.id = _student_id;

  LOOP
    code := 'DEC-' || abbr || '-' || to_char(_issued, 'YYYY') || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.student_certificates WHERE certificate_id = code);
  END LOOP;

  INSERT INTO public.student_certificates (student_id, course_level, certificate_id, student_display_name, instructor_name, issued_date)
  VALUES (_student_id, lvl, code, coalesce(nullif(sname,''), 'Student'), nullif(iname,''), _issued)
  RETURNING * INTO rec;
  RETURN rec;
END; $$;
REVOKE ALL ON FUNCTION public.award_certificate_internal(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.issue_student_certificate(_student_id uuid, _level text)
RETURNS public.student_certificates LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin() OR (public.has_role(auth.uid(), 'instructor') AND public.can_instructor_access_student(auth.uid(), _student_id))) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN public.award_certificate_internal(_student_id, _level, now());
END; $$;
REVOKE ALL ON FUNCTION public.issue_student_certificate(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_student_certificate(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.level_rank(_level text) RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_level,'')) WHEN 'novice' THEN 1 WHEN 'beginner' THEN 1 WHEN 'amateur' THEN 2
    WHEN 'intermediate' THEN 3 WHEN 'advanced' THEN 4 ELSE 0 END $$;

CREATE OR REPLACE FUNCTION public.students_level_certificate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o int := public.level_rank(OLD.level);
  n int := public.level_rank(NEW.level);
  i int;
BEGIN
  IF o > 0 AND n > o THEN
    FOR i IN o..(n-1) LOOP
      PERFORM public.award_certificate_internal(NEW.id,
        (ARRAY['Novice','Amateur','Intermediate','Advanced'])[i], now());
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.students_level_certificate() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER students_level_certificate_trg
AFTER UPDATE OF level ON public.students
FOR EACH ROW EXECUTE FUNCTION public.students_level_certificate();