import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useStudents, useExams, useClasses } from "@/hooks/useStudents";
import {
  CENTRE_NAME,
  formatDate,
  type Exam,
  type MarkStatus,
  type Student,
} from "@/lib/students";
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
import { Download, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  examId: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/c/$classId/export")({
  validateSearch: zodValidator(searchSchema),
  component: ExportPage,
  head: () => ({ meta: [{ title: "Export Image — Wisdom Maths" }] }),
});

type SortId = "high" | "low" | "name";

/* ---------- 10 Themes ---------- */
type Theme = {
  id: string;
  name: string;
  // gradient swatches for picker
  swatch: string;
  // card surface
  cardBg: string; // tailwind class on outer card
  // header
  headerBg: string; // gradient/bg classes for header band
  headerText: string;
  subText: string; // muted text on header
  // body
  bodyBg: string;
  bodyText: string;
  rowBg: string;
  rowAlt: string; // alternate row
  rowText: string;
  rowMuted: string;
  rankChip: string; // background+text for rank circle
  topRankChip: string;
  topRowBg: string;
  // mark pill
  markHi: string; // 90+
  markMid: string; // 75+
  markLow: string; // 50+
  markFail: string;
  markAb: string;
  markNo: string;
  // border
  divider: string;
};

const THEMES: Theme[] = [
  {
    id: "sunrise",
    name: "Sunrise",
    swatch: "linear-gradient(135deg,#fed7aa,#fbbf24,#f472b6)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-orange-300 via-amber-300 to-pink-300",
    headerText: "text-stone-900",
    subText: "text-stone-700/80",
    bodyBg: "bg-orange-50/50",
    bodyText: "text-stone-900",
    rowBg: "bg-white",
    rowAlt: "bg-orange-50",
    rowText: "text-stone-900",
    rowMuted: "text-stone-500",
    rankChip: "bg-orange-100 text-orange-900",
    topRankChip: "bg-stone-900 text-white",
    topRowBg: "bg-amber-100/70",
    markHi: "bg-emerald-200 text-emerald-900",
    markMid: "bg-amber-200 text-amber-900",
    markLow: "bg-orange-200 text-orange-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-orange-200",
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: "linear-gradient(135deg,#0ea5e9,#06b6d4,#22d3ee)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400",
    headerText: "text-white",
    subText: "text-white/80",
    bodyBg: "bg-sky-50/60",
    bodyText: "text-slate-900",
    rowBg: "bg-white",
    rowAlt: "bg-sky-50",
    rowText: "text-slate-900",
    rowMuted: "text-slate-500",
    rankChip: "bg-sky-100 text-sky-900",
    topRankChip: "bg-sky-700 text-white",
    topRowBg: "bg-cyan-100/70",
    markHi: "bg-emerald-200 text-emerald-900",
    markMid: "bg-cyan-200 text-cyan-900",
    markLow: "bg-sky-200 text-sky-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-slate-200 text-slate-700",
    divider: "border-sky-200",
  },
  {
    id: "forest",
    name: "Forest",
    swatch: "linear-gradient(135deg,#16a34a,#84cc16,#a3e635)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-emerald-600 via-green-500 to-lime-400",
    headerText: "text-white",
    subText: "text-white/85",
    bodyBg: "bg-emerald-50/50",
    bodyText: "text-emerald-950",
    rowBg: "bg-white",
    rowAlt: "bg-emerald-50",
    rowText: "text-emerald-950",
    rowMuted: "text-emerald-700/70",
    rankChip: "bg-emerald-100 text-emerald-900",
    topRankChip: "bg-emerald-800 text-white",
    topRowBg: "bg-lime-100/70",
    markHi: "bg-emerald-300 text-emerald-950",
    markMid: "bg-lime-200 text-lime-900",
    markLow: "bg-yellow-200 text-yellow-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-emerald-200",
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: "linear-gradient(135deg,#0f172a,#312e81,#7c3aed)",
    cardBg: "bg-slate-900",
    headerBg: "bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800",
    headerText: "text-white",
    subText: "text-violet-200/80",
    bodyBg: "bg-slate-900",
    bodyText: "text-white",
    rowBg: "bg-slate-800",
    rowAlt: "bg-slate-800/60",
    rowText: "text-white",
    rowMuted: "text-slate-400",
    rankChip: "bg-slate-700 text-slate-200",
    topRankChip: "bg-violet-500 text-white",
    topRowBg: "bg-violet-900/40",
    markHi: "bg-emerald-400/90 text-emerald-950",
    markMid: "bg-amber-300 text-amber-950",
    markLow: "bg-orange-300 text-orange-950",
    markFail: "bg-rose-400 text-rose-950",
    markAb: "bg-rose-500/30 text-rose-100",
    markNo: "bg-slate-600 text-slate-100",
    divider: "border-slate-700",
  },
  {
    id: "rose",
    name: "Rose Petal",
    swatch: "linear-gradient(135deg,#f43f5e,#ec4899,#f472b6)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-400",
    headerText: "text-white",
    subText: "text-white/85",
    bodyBg: "bg-rose-50/50",
    bodyText: "text-rose-950",
    rowBg: "bg-white",
    rowAlt: "bg-rose-50",
    rowText: "text-rose-950",
    rowMuted: "text-rose-700/70",
    rankChip: "bg-rose-100 text-rose-900",
    topRankChip: "bg-rose-700 text-white",
    topRowBg: "bg-pink-100/70",
    markHi: "bg-emerald-200 text-emerald-900",
    markMid: "bg-amber-200 text-amber-900",
    markLow: "bg-pink-200 text-pink-900",
    markFail: "bg-rose-300 text-rose-950",
    markAb: "bg-rose-200 text-rose-900",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-rose-200",
  },
  {
    id: "royal",
    name: "Royal",
    swatch: "linear-gradient(135deg,#581c87,#7c3aed,#fbbf24)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-purple-800 via-violet-700 to-amber-400",
    headerText: "text-white",
    subText: "text-amber-100/90",
    bodyBg: "bg-violet-50/50",
    bodyText: "text-violet-950",
    rowBg: "bg-white",
    rowAlt: "bg-violet-50",
    rowText: "text-violet-950",
    rowMuted: "text-violet-700/70",
    rankChip: "bg-violet-100 text-violet-900",
    topRankChip: "bg-amber-400 text-violet-950",
    topRowBg: "bg-amber-100/70",
    markHi: "bg-amber-300 text-amber-950",
    markMid: "bg-violet-300 text-violet-950",
    markLow: "bg-violet-200 text-violet-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-violet-200",
  },
  {
    id: "minimal",
    name: "Minimal Mono",
    swatch: "linear-gradient(135deg,#f5f5f5,#a3a3a3,#171717)",
    cardBg: "bg-white",
    headerBg: "bg-stone-900",
    headerText: "text-white",
    subText: "text-stone-300",
    bodyBg: "bg-white",
    bodyText: "text-stone-900",
    rowBg: "bg-stone-50",
    rowAlt: "bg-white",
    rowText: "text-stone-900",
    rowMuted: "text-stone-500",
    rankChip: "bg-stone-100 text-stone-900",
    topRankChip: "bg-stone-900 text-white",
    topRowBg: "bg-stone-100",
    markHi: "bg-stone-900 text-white",
    markMid: "bg-stone-700 text-white",
    markLow: "bg-stone-300 text-stone-900",
    markFail: "bg-stone-200 text-stone-700",
    markAb: "bg-stone-200 text-stone-700",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-stone-200",
  },
  {
    id: "candy",
    name: "Pastel Candy",
    swatch: "linear-gradient(135deg,#bfdbfe,#fbcfe8,#fde68a)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-blue-200 via-pink-200 to-yellow-200",
    headerText: "text-slate-800",
    subText: "text-slate-600",
    bodyBg: "bg-blue-50/40",
    bodyText: "text-slate-800",
    rowBg: "bg-white",
    rowAlt: "bg-pink-50/60",
    rowText: "text-slate-800",
    rowMuted: "text-slate-500",
    rankChip: "bg-pink-100 text-pink-800",
    topRankChip: "bg-pink-500 text-white",
    topRowBg: "bg-yellow-100",
    markHi: "bg-emerald-200 text-emerald-900",
    markMid: "bg-yellow-200 text-yellow-900",
    markLow: "bg-pink-200 text-pink-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-slate-200 text-slate-700",
    divider: "border-pink-200",
  },
  {
    id: "sunset",
    name: "Sunset Gold",
    swatch: "linear-gradient(135deg,#dc2626,#ea580c,#facc15)",
    cardBg: "bg-white",
    headerBg: "bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400",
    headerText: "text-white",
    subText: "text-yellow-100",
    bodyBg: "bg-orange-50/40",
    bodyText: "text-stone-900",
    rowBg: "bg-white",
    rowAlt: "bg-amber-50",
    rowText: "text-stone-900",
    rowMuted: "text-stone-500",
    rankChip: "bg-amber-100 text-amber-900",
    topRankChip: "bg-red-600 text-white",
    topRowBg: "bg-yellow-100",
    markHi: "bg-emerald-200 text-emerald-900",
    markMid: "bg-amber-300 text-amber-950",
    markLow: "bg-orange-200 text-orange-900",
    markFail: "bg-red-200 text-red-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-stone-200 text-stone-700",
    divider: "border-amber-200",
  },
  {
    id: "graphite",
    name: "Graphite Teal",
    swatch: "linear-gradient(135deg,#1f2937,#0d9488,#5eead4)",
    cardBg: "bg-slate-50",
    headerBg: "bg-gradient-to-br from-slate-800 via-teal-700 to-teal-400",
    headerText: "text-white",
    subText: "text-teal-100/90",
    bodyBg: "bg-slate-50",
    bodyText: "text-slate-900",
    rowBg: "bg-white",
    rowAlt: "bg-teal-50",
    rowText: "text-slate-900",
    rowMuted: "text-slate-500",
    rankChip: "bg-teal-100 text-teal-900",
    topRankChip: "bg-slate-900 text-teal-200",
    topRowBg: "bg-teal-100/70",
    markHi: "bg-teal-300 text-teal-950",
    markMid: "bg-teal-200 text-teal-900",
    markLow: "bg-amber-200 text-amber-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-slate-200 text-slate-700",
    divider: "border-slate-200",
  },
];

function ExportPage() {
  const { classId } = Route.useParams();
  const { examId } = Route.useSearch();
  const { classes, hydrated: ch } = useClasses();
  const { students, hydrated: sh } = useStudents(classId);
  const { exams, hydrated: eh } = useExams(classId);
  const [activeId, setActiveId] = useState<string>(examId);
  const [themeId, setThemeId] = useState<string>("sunrise");
  const [sort, setSort] = useState<SortId>("high");
  const cardRef = useRef<HTMLDivElement>(null);
  const pdfHostRef = useRef<HTMLDivElement>(null);
  const [busyPdf, setBusyPdf] = useState(false);

  const cls = classes.find((c) => c.id === classId);
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

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
      return { student: s, mark: m };
    });
    list.sort((a, b) => {
      if (sort === "name") return a.student.name.localeCompare(b.student.name);
      // For "high" order: numbers (high→low), then "no" (didn't write), then "ab" (absent), then unset.
      // Rank values are designed so larger = earlier when sorting high→low.
      const rank = (m: MarkStatus | undefined) => {
        if (typeof m === "number") return m + 1000; // numbers always above status codes
        if (m === "no") return -1; // தேர்வு எழுதவில்லை comes before absent
        if (m === "ab") return -2; // வரவில்லை last among entered
        return -3; // not entered
      };
      const ra = rank(a.mark);
      const rb = rank(b.mark);
      return sort === "high" ? rb - ra : ra - rb;
    });
    return list;
  }, [students, exam, sort]);

  if (!sh || !eh || !ch) return null;
  if (!cls) return null;

  async function handleExport() {
    if (!cardRef.current || !exam) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      link.download = `wisdom-${cls?.name.replace(/\s+/g, "")}-${safe}-${theme.id}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not export image");
    }
  }

  // PDF: 10 students per page. We render each chunk into an offscreen card
  // and capture it as PNG, then place it on a portrait A4 page.
  async function handleExportPdf() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPdf(true);
    try {
      const PER_PAGE = 10;
      const chunks: Row[][] = [];
      for (let i = 0; i < rows.length; i += PER_PAGE) {
        chunks.push(rows.slice(i, i + PER_PAGE));
      }
      if (chunks.length === 0) chunks.push([]);

      // A4 portrait
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;

      const host = pdfHostRef.current;

      for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
        // Mount a card into the host
        host.innerHTML = "";
        const slot = document.createElement("div");
        host.appendChild(slot);

        // Render React into the slot via direct portal would need extra setup;
        // instead we use a simple imperative path: build via temp React root.
        // To keep dependencies minimal, we re-use the visible card by toggling rows.
        // Simpler approach: clone the visible cardRef DOM, then replace its rows.
        // But cleanest: render via createRoot.
        const { createRoot } = await import("react-dom/client");
        const root = createRoot(slot);
        await new Promise<void>((resolve) => {
          root.render(
            <ClassCard
              exam={exam}
              rows={chunks[pageIdx]}
              theme={theme}
              className={cls.name}
              pageInfo={{ index: pageIdx, total: chunks.length, startRank: pageIdx * PER_PAGE }}
            />,
          );
          // give browser a tick to paint
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        const cardEl = slot.firstElementChild as HTMLElement | null;
        if (!cardEl) {
          root.unmount();
          continue;
        }
        const dataUrl = await toPng(cardEl, { pixelRatio: 2, cacheBust: true });

        // Compute image size to fit page width
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });
        const ratio = img.height / img.width;
        let drawW = usableW;
        let drawH = drawW * ratio;
        const maxH = pageH - margin * 2;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH / ratio;
        }
        const x = (pageW - drawW) / 2;
        const y = margin;

        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH);

        root.unmount();
      }

      host.innerHTML = "";
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      pdf.save(`wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}.pdf`);
      toast.success(`PDF downloaded · ${chunks.length} page${chunks.length > 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not export PDF");
    } finally {
      setBusyPdf(false);
    }
  }

  if (exams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <p className="text-sm text-ink-muted">No exams to export yet for this class.</p>
        <Link
          to="/c/$classId/marks"
          params={{ classId }}
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-surface hover:bg-ink/90"
        >
          Go to Mark Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Export Class Results</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Single-page <strong>PNG</strong> with all students, or paginated <strong>PDF</strong>{" "}
            (10 students per page).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExport}
            disabled={!exam}
            variant="outline"
            className="rounded-xl"
          >
            <Download className="mr-1 h-4 w-4" /> PNG (one page)
          </Button>
          <Button
            onClick={handleExportPdf}
            disabled={!exam || busyPdf}
            className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <FileText className="mr-1 h-4 w-4" />
            {busyPdf ? "Generating…" : "PDF (10 / page)"}
          </Button>
        </div>
      </div>

      {/* Hidden offscreen host for paginated PDF rendering */}
      <div
        ref={pdfHostRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 640,
          pointerEvents: "none",
          opacity: 0,
        }}
      />

      <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-ink-muted">Exam</Label>
            <Select value={activeId} onValueChange={setActiveId}>
              <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                <SelectValue placeholder="Choose exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.subject} · /{e.totalMarks} · {formatDate(e.date)}
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
        </div>

        <div className="mt-5">
          <Label className="mb-2 block text-xs font-medium text-ink-muted">
            <Sparkles className="-mt-0.5 mr-1 inline h-3 w-3" />
            Colour theme · {THEMES.length} options
          </Label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium transition-all",
                  themeId === t.id
                    ? "border-ink bg-ink text-surface"
                    : "border-border bg-canvas text-ink-muted hover:text-ink",
                )}
                title={t.name}
              >
                <span
                  className="h-5 w-5 rounded-full ring-2 ring-white"
                  style={{ background: t.swatch }}
                />
                <span className="pr-2">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-3xl bg-canvas p-3 ring-1 ring-border sm:p-6">
        <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Live Preview
        </div>
        {exam && cls && (
          <div className="mx-auto w-full max-w-[680px] overflow-x-auto">
            <ClassCard
              ref={cardRef}
              exam={exam}
              rows={rows}
              theme={theme}
              className={cls.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type Row = { student: Student; mark: MarkStatus | undefined };

const ClassCard = ({
  exam,
  rows,
  theme,
  className,
  pageInfo,
  ...rest
}: {
  exam: Exam;
  rows: Row[];
  theme: Theme;
  className: string;
  pageInfo?: { index: number; total: number; startRank: number };
} & { ref?: React.Ref<HTMLDivElement> }) => {
  const ref = (rest as { ref?: React.Ref<HTMLDivElement> }).ref;
  const date = formatDate(exam.date);
  const present = rows.filter((r) => typeof r.mark === "number").length;
  const absent = rows.filter((r) => r.mark === "ab").length;
  const startRank = pageInfo?.startRank ?? 0;

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden rounded-3xl shadow-card", theme.cardBg)}
      style={{ width: 640 }}
    >
      {/* Header */}
      <div className={cn("relative px-8 py-7", theme.headerBg)}>
        <div className={cn("text-[10px] font-bold uppercase tracking-[0.28em]", theme.subText)}>
          {CENTRE_NAME}
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className={cn("text-2xl font-bold leading-tight tracking-tight", theme.headerText)}>
              {exam.subject}
            </h2>
            <div className={cn("mt-1 text-xs font-medium", theme.subText)}>
              Class · <span className={theme.headerText}>{className}</span>
            </div>
          </div>
          <div className={cn("text-right text-[11px]", theme.subText)}>
            <div>Date</div>
            <div className={cn("text-sm font-bold", theme.headerText)}>{date}</div>
            <div className="mt-1">Total</div>
            <div className={cn("text-sm font-bold", theme.headerText)}>/ {exam.totalMarks}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={cn("px-6 py-6", theme.bodyBg)}>
        <ul className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const top = i < 3 && typeof r.mark === "number";
            return (
              <li
                key={r.student.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3",
                  top ? theme.topRowBg : i % 2 === 0 ? theme.rowBg : theme.rowAlt,
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                    top ? theme.topRankChip : theme.rankChip,
                  )}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-tamil truncate text-base font-semibold leading-tight",
                      theme.rowText,
                    )}
                  >
                    {r.student.name}
                  </div>
                </div>
                <MarkPill mark={r.mark} total={exam.totalMarks} theme={theme} />
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className={cn("mt-6 flex items-center justify-between border-t pt-4 text-[10px] uppercase tracking-[0.22em]", theme.divider, theme.rowMuted)}>
          <span>
            {rows.length} students · {present} present · {absent} absent
          </span>
          <span>Wisdom Maths · Result Sheet</span>
        </div>
      </div>
    </div>
  );
};

function MarkPill({
  mark,
  total,
  theme,
}: {
  mark: MarkStatus | undefined;
  total: number;
  theme: Theme;
}) {
  if (mark === "ab") {
    return (
      <span
        className={cn(
          "font-tamil inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
          theme.markAb,
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
          "font-tamil inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
          theme.markNo,
        )}
      >
        தேர்வு எழுதவில்லை
      </span>
    );
  }
  if (typeof mark === "number") {
    const pct = (mark / total) * 100;
    const tone =
      pct >= 90
        ? theme.markHi
        : pct >= 75
          ? theme.markMid
          : pct >= 50
            ? theme.markLow
            : theme.markFail;
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1 rounded-full px-3 py-1 text-sm font-bold tabular-nums",
          tone,
        )}
      >
        {mark}
        <span className="text-[10px] font-medium opacity-70">/ {total}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
      —
    </span>
  );
}
