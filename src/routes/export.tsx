import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useStudents, useExams } from "@/hooks/useStudents";
import {
  isAuthed,
  formatMark,
  CLASS_NAME,
  type Exam,
  type MarkStatus,
  type Student,
} from "@/lib/students";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  examId: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/export")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthed()) {
      throw redirect({ to: "/login" });
    }
  },
  validateSearch: zodValidator(searchSchema),
  component: ExportPage,
  head: () => ({ meta: [{ title: "Export Image — Wisdom Maths" }] }),
});

type StyleId = "minimal" | "vibrant" | "ledger";
type SortId = "high" | "low" | "name";

const STYLES: { id: StyleId; name: string; desc: string }[] = [
  { id: "minimal", name: "Minimal Card", desc: "Clean white with soft accents" },
  { id: "vibrant", name: "Vibrant Pastel", desc: "Bold gradient header & badges" },
  { id: "ledger", name: "Ledger Sheet", desc: "Classic ranked table layout" },
];

function ExportPage() {
  const { examId } = Route.useSearch();
  const { students, hydrated: sh } = useStudents();
  const { exams, hydrated: eh } = useExams();
  const [activeId, setActiveId] = useState<string>(examId);
  const [style, setStyle] = useState<StyleId>("minimal");
  const [sort, setSort] = useState<SortId>("high");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eh && !activeId && exams[0]) setActiveId(exams[0].id);
  }, [eh, exams, activeId]);

  const exam = useMemo<Exam | null>(
    () => exams.find((e) => e.id === activeId) ?? null,
    [exams, activeId],
  );

  const rows = useMemo(() => {
    if (!exam) return [];
    const list = students.map((s) => {
      const m = exam.marks[s.id];
      const numeric = typeof m === "number" ? m : -1;
      return { student: s, mark: m, numeric };
    });
    list.sort((a, b) => {
      if (sort === "name") return a.student.name.localeCompare(b.student.name);
      // high: numeric desc, then absent ("ab"=-2), then no-exam ("no"=-3)
      const rank = (m: MarkStatus | undefined) => {
        if (typeof m === "number") return m;
        if (m === "ab") return -2;
        if (m === "no") return -3;
        return -4;
      };
      const ra = rank(a.mark);
      const rb = rank(b.mark);
      return sort === "high" ? rb - ra : ra - rb;
    });
    return list;
  }, [students, exam, sort]);

  if (!sh || !eh) return null;

  async function handleExport() {
    if (!cardRef.current || !exam) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      link.download = `wisdom-${safe}-${style}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not export image");
    }
  }

  if (exams.length === 0) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
          <p className="text-sm text-ink-muted">No exams to export yet.</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface hover:bg-ink/90"
          >
            Go to Mark Entry
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Export Class Image</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Pick a style, sort order, then download a single shareable image.
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={!exam}
            className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Download className="mr-1 h-4 w-4" /> Download PNG
          </Button>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-medium text-ink-muted">Exam</Label>
              <Select value={activeId} onValueChange={setActiveId}>
                <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                  <SelectValue placeholder="Choose exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.subject} · /{e.totalMarks}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-ink-muted">Sort</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
                <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High → Low</SelectItem>
                  <SelectItem value="low">Low → High</SelectItem>
                  <SelectItem value="name">By name (A→Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-ink-muted">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as StyleId)}>
                <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Style picker chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  style === s.id
                    ? "border-ink bg-ink text-surface"
                    : "border-border bg-canvas text-ink-muted hover:text-ink",
                )}
              >
                <ImageIcon className="-mt-0.5 mr-1 inline h-3 w-3" />
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-3xl bg-canvas p-4 ring-1 ring-border sm:p-6">
          <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Live Preview
          </div>
          {exam && (
            <div className="mx-auto w-full max-w-[680px] overflow-x-auto">
              <ClassExportCard ref={cardRef} exam={exam} rows={rows} style={style} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

type Row = { student: Student; mark: MarkStatus | undefined };

const ClassExportCard = ({
  exam,
  rows,
  style,
  ...rest
}: {
  exam: Exam;
  rows: Row[];
  style: StyleId;
} & { ref?: React.Ref<HTMLDivElement> }) => {
  const ref = (rest as { ref?: React.Ref<HTMLDivElement> }).ref;
  const date = new Date(exam.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (style === "vibrant") {
    return (
      <div
        ref={ref}
        className="overflow-hidden rounded-3xl bg-surface shadow-card"
        style={{ width: 640 }}
      >
        <div
          className="relative px-8 py-7 text-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.92 0.06 40) 0%, oklch(0.91 0.05 300) 50%, oklch(0.91 0.06 230) 100%)",
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-ink/70">
            Wisdom Maths Tuition Centre · {CLASS_NAME}
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{exam.subject}</h2>
          <p className="mt-1 text-xs text-ink/70">
            Out of {exam.totalMarks} · {date}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 px-6 py-6">
          {rows.map((r, i) => (
            <RowVibrant key={r.student.id} row={r} rank={i + 1} total={exam.totalMarks} />
          ))}
        </div>
        <FooterStripe />
      </div>
    );
  }

  if (style === "ledger") {
    return (
      <div
        ref={ref}
        className="overflow-hidden rounded-2xl border-2 border-ink bg-surface"
        style={{ width: 640 }}
      >
        <div className="border-b-2 border-ink bg-ink px-6 py-5 text-surface">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-80">
                Wisdom Maths · {CLASS_NAME}
              </div>
              <h2 className="mt-1 text-xl font-bold">{exam.subject} — Result Ledger</h2>
            </div>
            <div className="text-right text-[11px] opacity-80">
              <div>Date: {date}</div>
              <div>Total: {exam.totalMarks}</div>
            </div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-canvas text-[11px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="w-10 border-b border-ink/30 px-3 py-2 text-left">#</th>
              <th className="border-b border-ink/30 px-3 py-2 text-left">Student</th>
              <th className="w-32 border-b border-ink/30 px-3 py-2 text-right">Marks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-[11px] tabular-nums text-ink-muted">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium leading-tight">{r.student.name}</div>
                  {r.student.nameTamil && (
                    <div className="font-tamil text-xs leading-tight text-ink-muted">
                      {r.student.nameTamil}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <MarkPill mark={r.mark} total={exam.totalMarks} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-canvas px-6 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          Wisdom Maths Tuition Centre
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl bg-surface p-8 shadow-card"
      style={{ width: 640 }}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lemon opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-mint opacity-50 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground">
              W
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Wisdom Maths Tuition Centre</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                Class · {CLASS_NAME}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-ink-muted">
            <div>{date}</div>
            <div className="font-semibold text-ink">/ {exam.totalMarks}</div>
          </div>
        </div>

        <div className="mt-5 border-y border-border py-3 text-center">
          <h2 className="text-xl font-semibold tracking-tight">{exam.subject}</h2>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            Class Result Sheet
          </p>
        </div>

        <ul className="mt-5 flex flex-col gap-2">
          {rows.map((r, i) => (
            <li
              key={r.student.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-canvas/50 px-4 py-3"
            >
              <span className="w-6 text-right text-xs font-semibold tabular-nums text-ink-muted">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium leading-tight">
                  {r.student.name}
                </div>
                {r.student.nameTamil && (
                  <div className="font-tamil truncate text-xs leading-tight text-ink-muted">
                    {r.student.nameTamil}
                  </div>
                )}
              </div>
              <MarkPill mark={r.mark} total={exam.totalMarks} />
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          <span>{rows.length} students</span>
          <span>wisdom maths · progress report</span>
        </div>
      </div>
    </div>
  );
};

function RowVibrant({
  row,
  rank,
  total,
}: {
  row: Row;
  rank: number;
  total: number;
}) {
  const top = rank <= 3 && typeof row.mark === "number";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3",
        top ? "bg-mint/60" : "bg-canvas",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
          top ? "bg-ink text-surface" : "bg-surface text-ink-muted",
        )}
      >
        {rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold leading-tight">{row.student.name}</div>
        {row.student.nameTamil && (
          <div className="font-tamil truncate text-xs leading-tight text-ink-muted">
            {row.student.nameTamil}
          </div>
        )}
      </div>
      <MarkPill mark={row.mark} total={total} />
    </div>
  );
}

function MarkPill({
  mark,
  total,
  compact,
}: {
  mark: MarkStatus | undefined;
  total: number;
  compact?: boolean;
}) {
  if (mark === "ab") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-rose/50 px-3 py-1 text-xs font-semibold text-ink",
          compact && "px-2 py-0.5 text-[11px]",
        )}
      >
        வரவில்லை
      </span>
    );
  }
  if (mark === "no") {
    return (
      <span
        className={cn(
          "font-tamil inline-flex items-center rounded-full bg-lilac/60 px-3 py-1 text-xs font-semibold text-ink",
          compact && "px-2 py-0.5 text-[11px]",
        )}
      >
        தேர்வு எழுதவில்லை
      </span>
    );
  }
  if (typeof mark === "number") {
    const pct = Math.round((mark / total) * 100);
    const tone =
      pct >= 90
        ? "bg-mint"
        : pct >= 75
          ? "bg-lemon"
          : pct >= 50
            ? "bg-peach"
            : "bg-rose/60";
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1 rounded-full px-3 py-1 text-sm font-bold tabular-nums text-ink",
          tone,
          compact && "px-2 py-0.5 text-xs",
        )}
      >
        {mark}
        <span className="text-[10px] font-medium opacity-70">/ {total}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-[11px] text-ink-muted">
      {formatMark(mark)}
    </span>
  );
}

function FooterStripe() {
  return (
    <div
      className="h-2"
      style={{
        background:
          "linear-gradient(90deg, oklch(0.93 0.06 160), oklch(0.95 0.07 95), oklch(0.92 0.06 40), oklch(0.91 0.05 300), oklch(0.91 0.06 230))",
      }}
    />
  );
}
