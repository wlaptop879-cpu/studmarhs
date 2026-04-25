export type Student = {
  id: string;
  name: string;
  nameTamil?: string;
  marks: number;
  maxMarks: number;
  subject: string;
  date: string; // ISO
};

const KEY = "wisdom-maths-students-v1";

export function loadStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Student[];
  } catch {
    return [];
  }
}

export function saveStudents(list: Student[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function gradeBand(pct: number): { label: string; tone: "mint" | "lemon" | "peach" | "rose" } {
  if (pct >= 90) return { label: "Outstanding", tone: "mint" };
  if (pct >= 75) return { label: "Excellent", tone: "lemon" };
  if (pct >= 50) return { label: "Good Progress", tone: "peach" };
  return { label: "Needs Practice", tone: "rose" };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase() || "·";
}

export function avatarTone(seed: string): "mint" | "peach" | "lilac" | "lemon" | "sky" | "rose" {
  const tones = ["mint", "peach", "lilac", "lemon", "sky", "rose"] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tones[h % tones.length];
}
