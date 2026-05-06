import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudents, useExams } from "@/hooks/useStudents";
import {
  initials,
  avatarTone,
  parseMarkInput,
  formatMark,
  isoToDateInput,
  dateInputToIso,
  leastMarkStorageKey,
  type Exam,
  type MarkStatus,
} from "@/lib/students";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Delete, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/c/$classId/marks")({
  component: MarkEntryPage,
  head: () => ({ meta: [{ title: "Mark Entry — Wisdom Maths" }] }),
});

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lilac: "bg-lilac",
  lemon: "bg-lemon",
  sky: "bg-sky",
  rose: "bg-rose",
};

type KeyboardAction =
  | { type: "digit"; value: string }
  | { type: "special"; value: "ab" | "no" }
  | { type: "clear" }
  | { type: "enter" };

function MarkEntryPage() {
  const { classId } = Route.useParams();
  const { students, hydrated: sh } = useStudents(classId);
  const { exams, createExam, updateExam, setMark, deleteExam, hydrated: eh } = useExams(classId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("Mathematics");
  const [newTotal, setNewTotal] = useState("100");
  const [newDate, setNewDate] = useState(isoToDateInput(new Date().toISOString()));

  useEffect(() => {
    if (eh && !activeId && exams[0]) setActiveId(exams[0].id);
  }, [eh, exams, activeId]);

  const active = useMemo<Exam | null>(
    () => exams.find((e) => e.id === activeId) ?? null,
    [exams, activeId],
  );

  if (!sh || !eh) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const total = Number(newTotal);
    if (!total || total < 1) return toast.error("Enter valid total marks");
    if (!newSubject.trim()) return toast.error("Enter subject");
    const ex = await createExam(newSubject, total, dateInputToIso(newDate));
    setActiveId(ex.id);
    toast.success("Exam created");
  }

  return (
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
            to="/c/$classId/export"
            params={{ classId }}
            search={{ examId: active.id }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <ImageIcon className="h-3.5 w-3.5" /> Export image
          </Link>
        )}
      </div>

      {students.length === 0 ? (
        <EmptyRoster classId={classId} />
      ) : exams.length === 0 ? (
        <NewExamForm
          subject={newSubject}
          setSubject={setNewSubject}
          total={newTotal}
          setTotal={setNewTotal}
          date={newDate}
          setDate={setNewDate}
          onCreate={handleCreate}
          firstTime
        />
      ) : (
        <>
          <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_120px_140px_auto] sm:items-end">
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
                  onChange={(e) => active && updateExam(active.id, { subject: e.target.value })}
                  className="mt-1 rounded-xl border-border bg-canvas"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-ink-muted">Total</Label>
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
              <div>
                <Label className="text-xs font-medium text-ink-muted">Date</Label>
                <Input
                  type="date"
                  value={active ? isoToDateInput(active.date) : ""}
                  onChange={(e) => {
                    if (active && e.target.value)
                      updateExam(active.id, { date: dateInputToIso(e.target.value) });
                  }}
                  className="mt-1 rounded-xl border-border bg-canvas"
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
                <Trash2 className="h-3.5 w-3.5" /> Delete
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
                date={newDate}
                setDate={setNewDate}
                onCreate={handleCreate}
              />
            </div>
          </details>

          {active && (
            <MarksList
              key={active.id}
              students={students}
              active={active}
              onSet={(sid, m) => setMark(active.id, sid, m)}
            />
          )}
        </>
      )}
    </div>
  );
}

function EmptyRoster({ classId }: { classId: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <p className="text-sm text-ink-muted">No students in this class yet.</p>
      <Link
        to="/c/$classId/students"
        params={{ classId }}
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
  date,
  setDate,
  onCreate,
  firstTime,
}: {
  subject: string;
  setSubject: (v: string) => void;
  total: string;
  setTotal: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  onCreate: (e: React.FormEvent) => void;
  firstTime?: boolean;
}) {
  return (
    <form
      onSubmit={onCreate}
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_160px_auto] lg:items-end",
        firstTime && "rounded-3xl border border-border bg-surface p-5 shadow-soft",
      )}
    >
      {firstTime && (
        <div className="lg:col-span-4">
          <h2 className="text-sm font-semibold">Create your first exam</h2>
          <p className="mt-1 text-xs text-ink-muted">Set the subject, total marks &amp; date.</p>
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
      <div>
        <Label className="text-xs font-medium text-ink-muted">Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 rounded-xl border-border bg-canvas"
        />
      </div>
      <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
        <Plus className="mr-1 h-4 w-4" /> Create
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [leastMarkText, setLeastMarkText] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(leastMarkStorageKey(active.id)) ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLeastMarkText(window.localStorage.getItem(leastMarkStorageKey(active.id)) ?? "");
  }, [active.id]);

  function updateLeastMark(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, String(active.totalMarks).length);
    const capped = digits ? String(Math.min(Number(digits), active.totalMarks)) : "";
    setLeastMarkText(capped);
    if (typeof window !== "undefined") {
      if (capped) window.localStorage.setItem(leastMarkStorageKey(active.id), capped);
      else window.localStorage.removeItem(leastMarkStorageKey(active.id));
    }
  }

  function focusIndex(i: number) {
    const safeIndex = Math.max(0, Math.min(i, students.length - 1));
    const el = document.querySelector<HTMLInputElement>(`input[data-mark-idx="${safeIndex}"]`);
    if (el) {
      el.focus();
      el.select();
    }
  }

  function handleKeyboard(action: KeyboardAction) {
    const target = document.querySelector<HTMLInputElement>(`input[data-mark-idx="${activeIndex}"]`);
    target?.focus();
    window.dispatchEvent(new CustomEvent<KeyboardAction>("wisdom-mark-key", { detail: action }));
  }

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
        {students.map((s, idx) => {
          const tone = avatarTone(s.name);
          const current = active.marks[s.id];
          return (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
            >
              <div
                className={cn(
                  "font-tamil flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  toneBg[tone],
                )}
              >
                {s.name.trim().charAt(0) || initials(s.name)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-tamil truncate text-sm font-medium">{s.name}</span>
              </div>
              <MarkInputCell
                index={idx}
                value={current}
                total={active.totalMarks}
                active={idx === activeIndex}
                onActive={() => setActiveIndex(idx)}
                onCommit={(m) => onSet(s.id, m)}
                onAdvance={() => {
                  const next = Math.min(idx + 1, students.length - 1);
                  setActiveIndex(next);
                  focusIndex(next);
                }}
                isLast={idx === students.length - 1}
              />
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-3 z-10 mt-4">
        <div className="rounded-[28px] border border-white/70 bg-gradient-to-br from-sky-50 via-white to-violet-100 p-4 shadow-card backdrop-blur">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                Touch Keyboard
              </div>
              <div className="font-tamil mt-1 text-xs font-semibold text-ink">
                Student {activeIndex + 1} / {students.length}
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-soft">
              <span className="font-tamil text-[11px] font-semibold text-ink-muted">Least mark</span>
              <Input
                value={leastMarkText}
                onChange={(e) => updateLeastMark(e.target.value)}
                placeholder="ex: 35"
                inputMode="numeric"
                className="h-9 w-20 rounded-xl bg-canvas text-center text-sm font-bold tabular-nums"
              />
            </label>
          </div>
          <MarkKeyboard onPress={handleKeyboard} />
        </div>
      </div>
      {students.length > 0 && (
        <p className="font-tamil mt-3 px-1 text-[11px] text-ink-muted">
          Enter அழுத்தினால் அடுத்த மாணவருக்கு தானாக செல்லும்.
        </p>
      )}
    </div>
  );
}

function MarkInputCell({
  index,
  value,
  total,
  active,
  onActive,
  onCommit,
  onAdvance,
  isLast,
}: {
  index: number;
  value: MarkStatus | undefined;
  total: number;
  active: boolean;
  onActive: () => void;
  onCommit: (m: MarkStatus | null) => void;
  onAdvance: () => void;
  isLast: boolean;
}) {
  const [text, setText] = useState<string>(value === undefined ? "" : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Don't overwrite the user's in-progress typing in another (focused) cell
    // — only sync local text from the prop when this input is NOT focused.
    if (document.activeElement === inputRef.current) return;
    setText(value === undefined ? "" : String(value));
  }, [value]);

  useEffect(() => {
    function handleKey(event: Event) {
      if (!active) return;
      const action = (event as CustomEvent<KeyboardAction>).detail;
      if (!action) return;
      inputRef.current?.focus();
      if (action.type === "digit") {
        setText((prev) => (prev.toLowerCase() === "ab" || prev.toLowerCase() === "no" ? action.value : `${prev}${action.value}`));
      } else if (action.type === "special") {
        setText(action.value);
        onCommit(action.value);
      } else if (action.type === "clear") {
        setText((prev) => prev.slice(0, -1));
      } else if (action.type === "enter") {
        const ok = commit(text);
        if (ok && !isLast) onAdvance();
        else if (ok) inputRef.current?.blur();
      }
    }
    window.addEventListener("wisdom-mark-key", handleKey);
    return () => window.removeEventListener("wisdom-mark-key", handleKey);
  }, [active, isLast, onAdvance, onCommit, text]);

  function commit(raw: string): boolean {
    if (raw.trim() === "") {
      onCommit(null);
      return true;
    }
    const parsed = parseMarkInput(raw, total);
    if (parsed === null) {
      toast.error('எண், "ab" (வரவில்லை) அல்லது "no" (தேர்வு எழுதவில்லை) உள்ளிடவும்');
      setText(value === undefined ? "" : String(value));
      return false;
    }
    onCommit(parsed);
    setText(String(parsed));
    return true;
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
        ref={inputRef}
        data-mark-idx={index}
        value={text}
        onFocus={onActive}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const ok = commit((e.target as HTMLInputElement).value);
            if (ok && !isLast) onAdvance();
            else if (ok && isLast) (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={`/ ${total}`}
        className={cn(
          "h-10 w-20 rounded-xl text-center text-sm tabular-nums transition-colors",
          tone,
        )}
        inputMode="text"
      />
      <span className="hidden w-24 text-[10px] uppercase tracking-wider text-ink-muted sm:block">
        {value === undefined ? "Pending" : formatMark(value)}
      </span>
    </div>
  );
}
