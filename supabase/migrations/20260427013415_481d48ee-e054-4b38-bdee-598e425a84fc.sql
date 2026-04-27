
-- Classes, students, exams, attendance for Wisdom Maths Tuition Centre
-- Public access (single shared workspace) - data lives in cloud, accessible from any device

CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_tamil TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_class ON public.students(class_id);

CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 100,
  exam_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  marks JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_class ON public.exams(class_id);

-- Attendance: one row per (class, date), per_student stores { studentId: { status: "present"|"absent", time: "HH:mm" } }
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  records JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, attendance_date)
);
CREATE INDEX idx_attendance_class_date ON public.attendance(class_id, attendance_date);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Public access policies (this is a shared tuition-centre tool, no per-user auth)
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public write classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update classes" ON public.classes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete classes" ON public.classes FOR DELETE USING (true);

CREATE POLICY "Public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public write students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update students" ON public.students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Public read exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Public write exams" ON public.exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update exams" ON public.exams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete exams" ON public.exams FOR DELETE USING (true);

CREATE POLICY "Public read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Public write attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update attendance" ON public.attendance FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete attendance" ON public.attendance FOR DELETE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
