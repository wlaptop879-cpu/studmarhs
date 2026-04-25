import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStudents, useExams } from "@/hooks/useStudents";
import {
  isAuthed,
  initials,
  avatarTone,
  parseMarkInput,
  formatMark,
  type Exam,
  type MarkStatus,
} from "@/lib/students";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthed()) {
      throw redirect({ to: "/login" });
    }
  },
  component: MarkEntryPage,
  head: () => ({
    meta: [{ title: "Mark Entry — Wisdom Maths Tuition Centre" }],
  }),
});

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lilac: "bg-lilac",
  lemon: "bg-lemon",
  sky: "bg-sky",
  rose: "bg-rose",
};

function MarkEntryPage() {
  const { students, hydrated: sh } = useStudents();
  const { exams, createExam, updateExam, setMark, deleteExam, hydrated: eh } = useExams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("Mathematics");
  const [newTotal, setNewTotal] = useState("100");

  // Auto-select most recent exam when hydrated
  useEffect(() => {
    if (eh && !activeId && exams[0]) setActiveId(exams[0].id);
  }, [eh, exams, activeId]);

  const active = useMemo<Exam | null>(
    () => exams.find((e) => e.id === activeId) ?? null,
    [exams, activeId],
  );

  if (!sh || !eh) return null;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const total = Number(newTotal);
    if (!total || total < 1) return toast.error("Enter valid total marks");
    if (!newSubject.trim()) return toast.error("Enter subject");
    const ex = createExam(newSubject, total);
    setActiveId(ex.id);
    toast.success("Exam created");
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mark Entry</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Type a number, <code className="rounded bg-canvas px-1 text-[11px]">ab</code> for
              absent, or <code className="rounded bg-canvas px-1 text-[11px]">no</code> if they
              didn't write the exam.
            </p>
          </div>
          {active && (
            <Link
              to="/export"
              search={{ examId: active.id }}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Export image
            </Link>
          )}
        </div>

        {students.length === 0 ? (
          <EmptyRoster />
        ) : exams.length === 0 ? (
          <NewExamForm
            subject={newSubject}
            setSubject={setNewSubject}
            total={newTotal}
            setTotal={setNewTotal}
            onCreate={handleCreate}
            firstTime
          />
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
                <div>
                  <Label className="text-xs font-medium text-ink-muted">Exam</Label>
                  <Select value={activeId ?? ""} onValueChange={setActiveId}>
                    <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.subject} · /{e.totalMarks} ·{" "}
                          {new Date(e.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-ink-muted">Subject</Label>
                  <Input
                    value={active?.subject ?? ""}
                    onChange={(e) =>
                      active && updateExam(active.id, { subject: e.target.value })
                    }
                    className="mt-1 rounded-xl border-border bg-canvas"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-ink-muted">Total marks</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={active?.totalMarks ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (active && v >= 1) updateExam(active.id, { totalMarks: v });
                    }}
                    className="mt-1 rounded-xl border-border bg-canvas tabular-nums"
                  />
                </div>
                <button
                  onClick={() => {
                    if (active && confirm("Delete this exam and its marks?")) {
                      deleteExam(active.id);
                      setActiveId(null);
                      toast.success("Exam deleted");
                    }
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border px-3 text-xs text-ink-muted hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete exam
                </button>
              </div>
            </div>

            <details className="rounded-3xl border border-dashed border-border bg-surface/60 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink-muted">
                + Create another exam
              </summary>
              <div className="mt-4">
                <NewExamForm
                  subject={newSubject}
                  setSubject={setNewSubject}
                  total={newTotal}
                  setTotal={setNewTotal}
                  onCreate={handleCreate}
                />
              </div>
            </details>

            {active && (
              <MarksList
                students={students}
                active={active}
                onSet={(sid, m) => setMark(active.id, sid, m)}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyRoster() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <p className="text-sm text-ink-muted">No students in roster yet.</p>
      <Link
        to="/admin"
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface hover:bg-ink/90"
      >
        <Plus className="h-3.5 w-3.5" /> Add students
      </Link>
    </div>
  );
}

function NewExamForm({
  subject,
  setSubject,
  total,
  setTotal,
  onCreate,
  firstTime,
}: {
  subject: string;
  setSubject: (v: string) => void;
  total: string;
  setTotal: (v: string) => void;
  onCreate: (e: React.FormEvent) => void;
  firstTime?: boolean;
}) {
  return (
    <form
      onSubmit={onCreate}
      className={cn(
        "grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end",
        firstTime && "rounded-3xl border border-border bg-surface p-5 shadow-soft",
      )}
    >
      {firstTime && (
        <div className="sm:col-span-3">
          <h2 className="text-sm font-semibold">Create your first exam</h2>
          <p className="mt-1 text-xs text-ink-muted">Set the subject and total marks once.</p>
        </div>
      )}
      <div>
        <Label className="text-xs font-medium text-ink-muted">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 rounded-xl border-border bg-canvas"
        />
      </div>
      <div>
        <Label className="text-xs font-medium text-ink-muted">Total marks</Label>
        <Input
          type="number"
          inputMode="numeric"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          className="mt-1 rounded-xl border-border bg-canvas tabular-nums"
        />
      </div>
      <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
        <Plus className="mr-1 h-4 w-4" /> Create exam
      </Button>
    </form>
  );
}

function MarksList({
  students,
  active,
  onSet,
}: {
  students: ReturnType<typeof useStudents>["students"];
  active: Exam;
  onSet: (studentId: string, mark: MarkStatus | null) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Marks · {active.subject} · /{active.totalMarks}
        </h2>
        <span className="text-[11px] text-ink-muted">
          {Object.keys(active.marks).length}/{students.length} entered
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {students.map((s) => {
          const tone = avatarTone(s.name);
          const current = active.marks[s.id];
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  toneBg[tone],
                )}
              >
                {initials(s.name)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{s.name}</span>
                {s.nameTamil && (
                  <span className="font-tamil truncate text-xs text-ink-muted">
                    {s.nameTamil}
                  </span>
                )}
              </div>
              <MarkInputCell
                value={current}
                total={active.totalMarks}
                onCommit={(m) => onSet(s.id, m)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MarkInputCell({
  value,
  total,
  onCommit,
}: {
  value: MarkStatus | undefined;
  total: number;
  onCommit: (m: MarkStatus | null) => void;
}) {
  const [text, setText] = useState<string>(value === undefined ? "" : String(value));

  // Sync if outside change
  useEffect(() => {
    setText(value === undefined ? "" : String(value));
  }, [value]);

  function commit(raw: string) {
    if (raw.trim() === "") {
      onCommit(null);
      return;
    }
    const parsed = parseMarkInput(raw, total);
    if (parsed === null) {
      toast.error('Use a number, "ab" (absent) or "no" (didn\'t write)');
      setText(value === undefined ? "" : String(value));
      return;
    }
    onCommit(parsed);
    setText(String(parsed));
  }

  const tone =
    value === "ab"
      ? "border-rose bg-rose/30 text-ink"
      : value === "no"
        ? "border-lilac bg-lilac/40 text-ink"
        : value !== undefined
          ? "border-mint bg-mint/40 text-ink font-semibold"
          : "border-border bg-canvas";

  return (
    <div className="flex items-center gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder={`/ ${total}`}
        className={cn(
          "h-10 w-20 rounded-xl text-center text-sm tabular-nums transition-colors",
          tone,
        )}
        inputMode="text"
      />
      <span className="hidden w-20 text-[10px] uppercase tracking-wider text-ink-muted sm:block">
        {value === undefined ? "Pending" : formatMark(value)}
      </span>
    </div>
  );
}
