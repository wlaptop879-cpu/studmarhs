-- Drop old public policies
DROP POLICY IF EXISTS "Public read classes" ON public.classes;
DROP POLICY IF EXISTS "Public write classes" ON public.classes;
DROP POLICY IF EXISTS "Public update classes" ON public.classes;
DROP POLICY IF EXISTS "Public delete classes" ON public.classes;

DROP POLICY IF EXISTS "Public read students" ON public.students;
DROP POLICY IF EXISTS "Public write students" ON public.students;
DROP POLICY IF EXISTS "Public update students" ON public.students;
DROP POLICY IF EXISTS "Public delete students" ON public.students;

DROP POLICY IF EXISTS "Public read exams" ON public.exams;
DROP POLICY IF EXISTS "Public write exams" ON public.exams;
DROP POLICY IF EXISTS "Public update exams" ON public.exams;
DROP POLICY IF EXISTS "Public delete exams" ON public.exams;

DROP POLICY IF EXISTS "Public read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Public write attendance" ON public.attendance;
DROP POLICY IF EXISTS "Public update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Public delete attendance" ON public.attendance;

-- Authenticated-only policies
CREATE POLICY "Authenticated read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update classes" ON public.classes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete classes" ON public.classes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update students" ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete students" ON public.students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update exams" ON public.exams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete exams" ON public.exams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated read attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete attendance" ON public.attendance FOR DELETE TO authenticated USING (true);