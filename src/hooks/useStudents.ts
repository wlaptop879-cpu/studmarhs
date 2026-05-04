import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type ClassRoom,
  type Student,
  type Exam,
  type MarkStatus,
} from "@/lib/students";

/* =====================================================================
   Cloud-backed hooks (Lovable Cloud / Supabase)
   Data is shared across all devices and users that open the website.
   ===================================================================== */

/* ----------------- Classes ----------------- */
export function useClasses() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: true });
      if (!alive) return;
      if (!error && data) {
        setClasses(
          data.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at })),
        );
      }
      setHydrated(true);
    })();

    const channel = supabase
      .channel(`classes-rt-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        async () => {
          const { data } = await supabase
            .from("classes")
            .select("*")
            .order("created_at", { ascending: true });
          if (data)
            setClasses(
              data.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at })),
            );
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addClass = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from("classes")
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error || !data) throw error;
    const next: ClassRoom = { id: data.id, name: data.name, createdAt: data.created_at };
    setClasses((prev) => [...prev, next]);
    return next;
  }, []);

  const updateClass = useCallback(async (id: string, patch: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (patch.name !== undefined) {
      await supabase.from("classes").update({ name: patch.name }).eq("id", id);
    }
  }, []);

  const deleteClass = useCallback(async (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("classes").delete().eq("id", id);
  }, []);

  return { classes, addClass, updateClass, deleteClass, hydrated };
}

/* ----------------- Students ----------------- */
export function useStudents(classId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: true });
      if (!alive) return;
      if (data) {
        setStudents(
          data.map((r) => ({
            id: r.id,
            classId: r.class_id,
            name: r.name,
            nameTamil: r.name_tamil ?? undefined,
            createdAt: r.created_at,
          })),
        );
      }
      setHydrated(true);
    })();

    const channel = supabase
      .channel(`students-rt-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        async () => {
          const { data } = await supabase
            .from("students")
            .select("*")
            .order("created_at", { ascending: true });
          if (data)
            setStudents(
              data.map((r) => ({
                id: r.id,
                classId: r.class_id,
                name: r.name,
                nameTamil: r.name_tamil ?? undefined,
                createdAt: r.created_at,
              })),
            );
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const inClass = classId ? students.filter((s) => s.classId === classId) : students;

  const addStudent = useCallback(
    async (name: string, _nameTamil?: string, cId?: string) => {
      const targetClass = cId ?? classId;
      if (!targetClass) throw new Error("classId required");
      const { data, error } = await supabase
        .from("students")
        .insert({ class_id: targetClass, name: name.trim() })
        .select()
        .single();
      if (error || !data) throw error;
      const next: Student = {
        id: data.id,
        classId: data.class_id,
        name: data.name,
        createdAt: data.created_at,
      };
      setStudents((prev) => [...prev, next]);
      return next;
    },
    [classId],
  );

  const updateStudent = useCallback(async (id: string, patch: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const upd: { name?: string; name_tamil?: string | null } = {};
    if (patch.name !== undefined) upd.name = patch.name;
    if (patch.nameTamil !== undefined) upd.name_tamil = patch.nameTamil ?? null;
    if (Object.keys(upd).length > 0) {
      await supabase.from("students").update(upd).eq("id", id);
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("students").delete().eq("id", id);
  }, []);

  return {
    students: inClass,
    allStudents: students,
    addStudent,
    updateStudent,
    deleteStudent,
    hydrated,
  };
}

/* ----------------- Exams ----------------- */
function rowToExam(r: {
  id: string;
  class_id: string;
  subject: string;
  total_marks: number;
  exam_date: string;
  marks: unknown;
}): Exam {
  return {
    id: r.id,
    classId: r.class_id,
    subject: r.subject,
    totalMarks: r.total_marks,
    date: r.exam_date,
    marks: (r.marks as Record<string, MarkStatus>) ?? {},
  };
}

export function useExams(classId?: string) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const examsRef = useRef<Exam[]>([]);
  const pendingMarksRef = useRef<Record<string, Record<string, MarkStatus | null>>>({});
  const writeQueuesRef = useRef<Record<string, Promise<void>>>({});

  const mergePendingMarks = useCallback((incoming: Exam[]) => {
    return incoming.map((exam) => {
      const pending = pendingMarksRef.current[exam.id];
      if (!pending) return exam;
      const marks = { ...exam.marks };
      Object.entries(pending).forEach(([studentId, mark]) => {
        if (mark === null) delete marks[studentId];
        else marks[studentId] = mark;
      });
      return { ...exam, marks };
    });
  }, []);

  useEffect(() => {
    examsRef.current = exams;
  }, [exams]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .order("exam_date", { ascending: false });
      if (!alive) return;
      if (data) {
        const next = mergePendingMarks(data.map(rowToExam));
        examsRef.current = next;
        setExams(next);
      }
      setHydrated(true);
    })();

    const channel = supabase
      .channel(`exams-rt-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exams" },
        async () => {
          const { data } = await supabase
            .from("exams")
            .select("*")
            .order("exam_date", { ascending: false });
          if (data) {
            const next = mergePendingMarks(data.map(rowToExam));
            examsRef.current = next;
            setExams(next);
          }
        },
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [mergePendingMarks]);

  const inClass = classId ? exams.filter((e) => e.classId === classId) : exams;

  const createExam = useCallback(
    async (subject: string, totalMarks: number, dateIso?: string, cId?: string) => {
      const targetClass = cId ?? classId;
      if (!targetClass) throw new Error("classId required");
      const { data, error } = await supabase
        .from("exams")
        .insert({
          class_id: targetClass,
          subject: subject.trim() || "Mathematics",
          total_marks: totalMarks,
          exam_date: dateIso ?? new Date().toISOString(),
          marks: {},
        })
        .select()
        .single();
      if (error || !data) throw error;
      const next = rowToExam(data);
      setExams((prev) => [next, ...prev]);
      return next;
    },
    [classId],
  );

  const updateExam = useCallback(async (id: string, patch: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const upd: {
      subject?: string;
      total_marks?: number;
      exam_date?: string;
      marks?: Record<string, MarkStatus>;
    } = {};
    if (patch.subject !== undefined) upd.subject = patch.subject;
    if (patch.totalMarks !== undefined) upd.total_marks = patch.totalMarks;
    if (patch.date !== undefined) upd.exam_date = patch.date;
    if (patch.marks !== undefined) upd.marks = patch.marks;
    if (Object.keys(upd).length > 0) {
      await supabase.from("exams").update(upd).eq("id", id);
    }
  }, []);

  const setMark = useCallback(
    async (examId: string, studentId: string, mark: MarkStatus | null) => {
      const currentExam = examsRef.current.find((e) => e.id === examId);
      if (!currentExam) return;

      const nextMarks = { ...currentExam.marks };
      if (mark === null) delete nextMarks[studentId];
      else nextMarks[studentId] = mark;

      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, marks: nextMarks } : e)),
      );
      examsRef.current = examsRef.current.map((e) =>
        e.id === examId ? { ...e, marks: nextMarks } : e,
      );
      await supabase.from("exams").update({ marks: nextMarks }).eq("id", examId);
    },
    [],
  );

  const deleteExam = useCallback(async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("exams").delete().eq("id", id);
  }, []);

  return { exams: inClass, allExams: exams, createExam, updateExam, setMark, deleteExam, hydrated };
}
