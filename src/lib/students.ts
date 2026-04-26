// Class (e.g., "Std 10", "Std 11", "Std 12")
export type ClassRoom = {
  id: string;
  name: string;
  createdAt: string;
};

// Roster (student record - belongs to a class)
export type Student = {
  id: string;
  classId: string;
  name: string;
  nameTamil?: string;
  createdAt: string;
};

// Mark status: numeric, "ab" = absent, "no" = did not write exam
export type MarkStatus = number | "ab" | "no";

// One exam session containing marks for all students of a class
export type Exam = {
  id: string;
  classId: string;
  subject: string;
  totalMarks: number;
  date: string; // ISO (user-editable)
  marks: Record<string, MarkStatus>; // studentId -> status
};

const CLASSES_KEY = "wisdom-classes-v1";
const STUDENTS_KEY = "wisdom-students-v3";
const EXAMS_KEY = "wisdom-exams-v3";

export const CENTRE_NAME = "Wisdom Maths Tuition Centre";

/* ---------- Classes ---------- */
export function loadClasses(): ClassRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    return raw ? (JSON.parse(raw) as ClassRoom[]) : [];
  } catch {
    return [];
  }
}
export function saveClasses(list: ClassRoom[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLASSES_KEY, JSON.stringify(list));
}

/* ---------- Students ---------- */
export function loadStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? (JSON.parse(raw) as Student[]) : [];
  } catch {
    return [];
  }
}
export function saveStudents(list: Student[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
}

/* ---------- Exams ---------- */
export function loadExams(): Exam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXAMS_KEY);
    return raw ? (JSON.parse(raw) as Exam[]) : [];
  } catch {
    return [];
  }
}
export function saveExams(list: Exam[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(EXAMS_KEY, JSON.stringify(list));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function gradeBand(pct: number): { label: string; tone: "mint" | "lemon" | "peach" | "rose" } {
  if (pct >= 90) return { label: "Outstanding", tone: "mint" };
  if (pct >= 75) return { label: "Excellent", tone: "lemon" };
  if (pct >= 50) return { label: "Good", tone: "peach" };
  return { label: "Needs Practice", tone: "rose" };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·";
}

export function avatarTone(seed: string): "mint" | "peach" | "lilac" | "lemon" | "sky" | "rose" {
  const tones = ["mint", "peach", "lilac", "lemon", "sky", "rose"] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}

// Parse a free-form mark cell into MarkStatus. Empty string => null (no value yet)
export function parseMarkInput(raw: string, total: number): MarkStatus | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "ab" || v === "absent") return "ab";
  if (v === "no" || v === "n/a" || v === "na") return "no";
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  if (n < 0) return 0;
  if (n > total) return total;
  return Math.round(n);
}

export function formatMark(m: MarkStatus | undefined, opts?: { tamil?: boolean }): string {
  if (m === undefined) return "—";
  if (m === "ab") return opts?.tamil ? "வரவில்லை" : "Absent";
  if (m === "no") return opts?.tamil ? "தேர்வு எழுதவில்லை" : "Did not write";
  return String(m);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Convert ISO -> "yyyy-mm-dd" for <input type="date">
export function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function dateInputToIso(v: string): string {
  // treat as local date
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0).toISOString();
}
