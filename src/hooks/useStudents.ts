import { useCallback, useEffect, useState } from "react";
import { loadStudents, saveStudents, uid, type Student } from "@/lib/students";

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

  const addStudent = useCallback((s: Omit<Student, "id" | "date"> & { date?: string }) => {
    const next: Student = {
      id: uid(),
      date: s.date ?? new Date().toISOString(),
      ...s,
    };
    setStudents((prev) => [next, ...prev]);
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
