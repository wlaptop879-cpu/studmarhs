import { useCallback, useEffect, useState } from "react";
import {
  loadClasses,
  saveClasses,
  loadStudents,
  saveStudents,
  loadExams,
  saveExams,
  uid,
  type ClassRoom,
  type Student,
  type Exam,
  type MarkStatus,
} from "@/lib/students";

/* ----------------- Classes ----------------- */
export function useClasses() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClasses(loadClasses());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveClasses(classes);
  }, [classes, hydrated]);

  const addClass = useCallback((name: string) => {
    const next: ClassRoom = {
      id: uid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    setClasses((prev) => [...prev, next]);
    return next;
  }, []);

  const updateClass = useCallback((id: string, patch: Partial<ClassRoom>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    // cascade clean students & exams
    saveStudents(loadStudents().filter((s) => s.classId !== id));
    saveExams(loadExams().filter((e) => e.classId !== id));
  }, []);

  return { classes, addClass, updateClass, deleteClass, hydrated };
}

/* ----------------- Students ----------------- */
export function useStudents(classId?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStudents(loadStudents());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveStudents(students);
  }, [students, hydrated]);

  const inClass = classId ? students.filter((s) => s.classId === classId) : students;

  const addStudent = useCallback(
    (name: string, nameTamil?: string, cId?: string) => {
      const targetClass = cId ?? classId;
      if (!targetClass) throw new Error("classId required");
      const next: Student = {
        id: uid(),
        classId: targetClass,
        name: name.trim(),
        nameTamil: nameTamil?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setStudents((prev) => [...prev, next]);
      return next;
    },
    [classId],
  );

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { students: inClass, allStudents: students, addStudent, updateStudent, deleteStudent, hydrated };
}

/* ----------------- Exams ----------------- */
export function useExams(classId?: string) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExams(loadExams());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveExams(exams);
  }, [exams, hydrated]);

  const inClass = classId ? exams.filter((e) => e.classId === classId) : exams;

  const createExam = useCallback(
    (subject: string, totalMarks: number, dateIso?: string, cId?: string) => {
      const targetClass = cId ?? classId;
      if (!targetClass) throw new Error("classId required");
      const next: Exam = {
        id: uid(),
        classId: targetClass,
        subject: subject.trim() || "Mathematics",
        totalMarks,
        date: dateIso ?? new Date().toISOString(),
        marks: {},
      };
      setExams((prev) => [next, ...prev]);
      return next;
    },
    [classId],
  );

  const updateExam = useCallback((id: string, patch: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const setMark = useCallback((examId: string, studentId: string, mark: MarkStatus | null) => {
    setExams((prev) =>
      prev.map((e) => {
        if (e.id !== examId) return e;
        const next = { ...e.marks };
        if (mark === null) delete next[studentId];
        else next[studentId] = mark;
        return { ...e, marks: next };
      }),
    );
  }, []);

  const deleteExam = useCallback((id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { exams: inClass, allExams: exams, createExam, updateExam, setMark, deleteExam, hydrated };
}
