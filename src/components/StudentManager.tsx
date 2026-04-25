import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Pencil, Trash2, Search, Plus, Download, X } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { avatarTone, gradeBand, initials, type Student } from "@/lib/students";
import { ProgressCard } from "./ProgressCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lilac: "bg-lilac",
  lemon: "bg-lemon",
  sky: "bg-sky",
  rose: "bg-rose",
};

type FormState = {
  name: string;
  nameTamil: string;
  marks: string;
  maxMarks: string;
  subject: string;
};

const empty: FormState = {
  name: "",
  nameTamil: "",
  marks: "",
  maxMarks: "100",
  subject: "Mathematics",
};

export function StudentManager() {
  const { students, addStudent, updateStudent, deleteStudent, hydrated } = useStudents();
  const [form, setForm] = useState<FormState>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Distinct names from store for autofill
  const knownNames = useMemo(() => {
    const map = new Map<string, { name: string; nameTamil?: string }>();
    for (const s of students) {
      if (!map.has(s.name.toLowerCase())) {
        map.set(s.name.toLowerCase(), { name: s.name, nameTamil: s.nameTamil });
      }
    }
    return Array.from(map.values());
  }, [students]);

  const nameSuggestions = useMemo(() => {
    const q = form.name.trim().toLowerCase();
    if (!q) return [];
    return knownNames
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          (n.nameTamil ?? "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [knownNames, form.name]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameTamil ?? "").toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q),
    );
  }, [students, query]);

  const previewStudent = useMemo<Student | null>(() => {
    if (previewId) return students.find((s) => s.id === previewId) ?? null;
    if (form.name && form.marks) {
      return {
        id: "preview",
        name: form.name,
        nameTamil: form.nameTamil || undefined,
        marks: Number(form.marks) || 0,
        maxMarks: Number(form.maxMarks) || 100,
        subject: form.subject || "Mathematics",
        date: new Date().toISOString(),
      };
    }
    return students[0] ?? null;
  }, [previewId, students, form]);

  function resetForm() {
    setForm(empty);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const marks = Number(form.marks);
    const maxMarks = Number(form.maxMarks) || 100;
    if (!name) return toast.error("Please enter a student name");
    if (Number.isNaN(marks) || marks < 0) return toast.error("Enter valid marks");
    if (marks > maxMarks) return toast.error(`Marks cannot exceed ${maxMarks}`);

    if (editingId) {
      updateStudent(editingId, {
        name,
        nameTamil: form.nameTamil.trim() || undefined,
        marks,
        maxMarks,
        subject: form.subject.trim() || "Mathematics",
      });
      toast.success("Record updated");
    } else {
      const created = addStudent({
        name,
        nameTamil: form.nameTamil.trim() || undefined,
        marks,
        maxMarks,
        subject: form.subject.trim() || "Mathematics",
      });
      setPreviewId(created.id);
      toast.success("Student added");
    }
    resetForm();
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      nameTamil: s.nameTamil ?? "",
      marks: String(s.marks),
      maxMarks: String(s.maxMarks),
      subject: s.subject,
    });
    setPreviewId(s.id);
  }

  function pickSuggestion(n: { name: string; nameTamil?: string }) {
    setForm((f) => ({ ...f, name: n.name, nameTamil: n.nameTamil ?? f.nameTamil }));
    setShowSuggest(false);
  }

  async function handleExport() {
    if (!cardRef.current || !previewStudent) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const safeName = previewStudent.name.replace(/[^a-z0-9_-]+/gi, "_");
      link.download = `wisdom-${safeName}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not export image");
    }
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 lg:px-8 lg:py-12">
      {/* Header */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Educator Portal
          </div>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            Wisdom Maths Tuition Centre
          </h1>
          <p className="text-sm text-ink-muted">
            Record marks and share beautifully designed progress cards.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="rounded-xl border-border bg-surface pl-9"
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: form + list */}
        <div className="flex flex-col gap-6">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-surface p-6 shadow-soft"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit record" : "Add new record"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-ink-muted hover:bg-canvas"
                >
                  <X className="h-3 w-3" /> Cancel edit
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-medium text-ink-muted">
                  Student name (English)
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setShowSuggest(true);
                  }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="e.g. Meera Krishnan"
                  className="mt-1 rounded-xl border-border bg-canvas"
                  autoComplete="off"
                />
                {showSuggest && nameSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                    {nameSuggestions.map((n) => (
                      <button
                        key={n.name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(n)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-canvas"
                      >
                        <span>{n.name}</span>
                        {n.nameTamil && (
                          <span className="font-tamil text-xs text-ink-muted">
                            {n.nameTamil}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="nameTamil" className="text-xs font-medium text-ink-muted">
                  Student name (Tamil)
                </Label>
                <Input
                  id="nameTamil"
                  lang="ta"
                  value={form.nameTamil}
                  onChange={(e) => setForm({ ...form, nameTamil: e.target.value })}
                  placeholder="மீரா கிருஷ்ணன்"
                  className="font-tamil mt-1 rounded-xl border-border bg-canvas"
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-xs font-medium text-ink-muted">
                  Subject / Test
                </Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Mathematics"
                  className="mt-1 rounded-xl border-border bg-canvas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="marks" className="text-xs font-medium text-ink-muted">
                    Marks
                  </Label>
                  <Input
                    id="marks"
                    type="number"
                    inputMode="numeric"
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: e.target.value })}
                    placeholder="0"
                    className="mt-1 rounded-xl border-border bg-canvas tabular-nums"
                  />
                </div>
                <div>
                  <Label htmlFor="maxMarks" className="text-xs font-medium text-ink-muted">
                    Out of
                  </Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    inputMode="numeric"
                    value={form.maxMarks}
                    onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                    className="mt-1 rounded-xl border-border bg-canvas tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                className="rounded-xl bg-ink text-surface hover:bg-ink/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                {editingId ? "Save changes" : "Add student"}
              </Button>
            </div>
          </form>

          {/* List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Records · {filtered.length}
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
                <p className="text-sm text-ink-muted">
                  {students.length === 0
                    ? "No students yet. Add your first record above."
                    : "No matches for your search."}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {filtered.map((s) => {
                  const tone = avatarTone(s.name);
                  const pct = Math.round((s.marks / s.maxMarks) * 100);
                  const band = gradeBand(pct);
                  const isActive = previewId === s.id;
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        "group flex items-center gap-4 rounded-2xl border bg-surface p-4 transition-all",
                        isActive
                          ? "border-brand/40 shadow-card ring-4 ring-brand-soft"
                          : "border-border shadow-soft hover:border-ink/15",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewId(s.id)}
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold",
                          toneBg[tone],
                        )}
                      >
                        {initials(s.name)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewId(s.id)}
                        className="flex min-w-0 flex-1 flex-col text-left"
                      >
                        <span className="truncate text-base font-medium">{s.name}</span>
                        {s.nameTamil && (
                          <span className="font-tamil truncate text-sm text-ink-muted">
                            {s.nameTamil}
                          </span>
                        )}
                        <span className="mt-1 text-[11px] uppercase tracking-wider text-ink-muted">
                          {s.subject} · {band.label}
                        </span>
                      </button>
                      <div className="hidden items-baseline gap-1 border-l border-border pl-4 sm:flex">
                        <span className="text-2xl font-semibold tabular-nums">{s.marks}</span>
                        <span className="text-xs text-ink-muted tabular-nums">/{s.maxMarks}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(s)}
                          className="rounded-lg p-2 text-ink-muted hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: preview */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-3xl bg-canvas p-6 ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                Live Preview
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleExport}
                disabled={!previewStudent}
                className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Download className="mr-1 h-4 w-4" /> Export PNG
              </Button>
            </div>
            {previewStudent ? (
              <ProgressCard ref={cardRef} student={previewStudent} />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-dashed border-border bg-surface text-center text-sm text-ink-muted">
                Add a student to see the card
              </div>
            )}
            <p className="mt-4 text-center text-xs text-ink-muted">
              Tap any student in the list to preview their card here.
            </p>
          </div>
        </aside>
      </div>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.name}
              {confirmDelete?.nameTamil ? ` (${confirmDelete.nameTamil})` : ""} will be
              permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  deleteStudent(confirmDelete.id);
                  if (previewId === confirmDelete.id) setPreviewId(null);
                  toast.success("Record deleted");
                }
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
