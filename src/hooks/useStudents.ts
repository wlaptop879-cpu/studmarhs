import { useCallback, useEffect, useState } from "react";
import {
  loadStudents,
  saveStudents,
  loadExams,
  saveExams,
  uid,
  type Student,
  type Exam,
  type MarkStatus,
} from "@/lib/students";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStudents(loadStudents());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveStudents(students);
  }, [students, hydrated]);

  const addStudent = useCallback((name: string, nameTamil?: string) => {
    const next: Student = {
      id: uid(),
      name: name.trim(),
      nameTamil: nameTamil?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [...prev, next]);
    return next;
  }, []);

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { students, addStudent, updateStudent, deleteStudent, hydrated };
}

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setExams(loadExams());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveExams(exams);
  }, [exams, hydrated]);

  const createExam = useCallback((subject: string, totalMarks: number) => {
    const next: Exam = {
      id: uid(),
      subject: subject.trim() || "Mathematics",
      totalMarks,
      date: new Date().toISOString(),
      marks: {},
    };
    setExams((prev) => [next, ...prev]);
    return next;
  }, []);

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

  return { exams, createExam, updateExam, setMark, deleteExam, hydrated };
}
