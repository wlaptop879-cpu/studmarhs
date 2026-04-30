import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
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
import { Download, FileText, Sparkles, Check, Loader2, ImageDown } from "lucide-react";
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
  swatch: string;
  cardBg: string;
  headerBg: string;
  headerText: string;
  subText: string;
  bodyBg: string;
  bodyText: string;
  rowBg: string;
  rowAlt: string;
  rowText: string;
  rowMuted: string;
  rankChip: string;
  topRankChip: string;
  topRowBg: string;
  markHi: string;
  markMid: string;
  markLow: string;
  markFail: string;
  markAb: string;
  markNo: string;
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
    bodyBg: "bg-orange-50",
    bodyText: "text-stone-900",
    rowBg: "bg-white",
    rowAlt: "bg-orange-50",
    rowText: "text-stone-900",
    rowMuted: "text-stone-500",
    rankChip: "bg-orange-100 text-orange-900",
    topRankChip: "bg-stone-900 text-white",
    topRowBg: "bg-amber-100",
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
    bodyBg: "bg-sky-50",
    bodyText: "text-slate-900",
    rowBg: "bg-white",
    rowAlt: "bg-sky-50",
    rowText: "text-slate-900",
    rowMuted: "text-slate-500",
    rankChip: "bg-sky-100 text-sky-900",
    topRankChip: "bg-sky-700 text-white",
    topRowBg: "bg-cyan-100",
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
    bodyBg: "bg-emerald-50",
    bodyText: "text-emerald-950",
    rowBg: "bg-white",
    rowAlt: "bg-emerald-50",
    rowText: "text-emerald-950",
    rowMuted: "text-emerald-700/70",
    rankChip: "bg-emerald-100 text-emerald-900",
    topRankChip: "bg-emerald-800 text-white",
    topRowBg: "bg-lime-100",
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
    markHi: "bg-emerald-400 text-emerald-950",
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
    bodyBg: "bg-rose-50",
    bodyText: "text-rose-950",
    rowBg: "bg-white",
    rowAlt: "bg-rose-50",
    rowText: "text-rose-950",
    rowMuted: "text-rose-700/70",
    rankChip: "bg-rose-100 text-rose-900",
    topRankChip: "bg-rose-700 text-white",
    topRowBg: "bg-pink-100",
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
    subText: "text-amber-100",
    bodyBg: "bg-violet-50",
    bodyText: "text-violet-950",
    rowBg: "bg-white",
    rowAlt: "bg-violet-50",
    rowText: "text-violet-950",
    rowMuted: "text-violet-700/70",
    rankChip: "bg-violet-100 text-violet-900",
    topRankChip: "bg-amber-400 text-violet-950",
    topRowBg: "bg-amber-100",
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
    bodyBg: "bg-blue-50",
    bodyText: "text-slate-800",
    rowBg: "bg-white",
    rowAlt: "bg-pink-50",
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
    bodyBg: "bg-orange-50",
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
    subText: "text-teal-100",
    bodyBg: "bg-slate-50",
    bodyText: "text-slate-900",
    rowBg: "bg-white",
    rowAlt: "bg-teal-50",
    rowText: "text-slate-900",
    rowMuted: "text-slate-500",
    rankChip: "bg-teal-100 text-teal-900",
    topRankChip: "bg-slate-900 text-teal-200",
    topRowBg: "bg-teal-100",
    markHi: "bg-teal-300 text-teal-950",
    markMid: "bg-teal-200 text-teal-900",
    markLow: "bg-amber-200 text-amber-900",
    markFail: "bg-rose-200 text-rose-900",
    markAb: "bg-rose-100 text-rose-800",
    markNo: "bg-slate-200 text-slate-700",
    divider: "border-slate-200",
  },
];

const PER_PAGE_PDF = 10;
const CARD_WIDTH = 720;

async function captureNode(node: HTMLElement): Promise<string> {
  const canvas = await html2canvas(node, {
    scale: 2.5,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  return canvas.toDataURL("image/png");
}

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
  const [busyPng, setBusyPng] = useState(false);
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
      const rank = (m: MarkStatus | undefined) => {
        if (typeof m === "number") return m + 1000;
        if (m === "no") return -1;
        if (m === "ab") return -2;
        return -3;
      };
      const ra = rank(a.mark);
      const rb = rank(b.mark);
      return sort === "high" ? rb - ra : ra - rb;
    });
    return list;
  }, [students, exam, sort]);

  const stats = useMemo(() => {
    const present = rows.filter((r) => typeof r.mark === "number").length;
    const absent = rows.filter((r) => r.mark === "ab").length;
    const numeric = rows
      .map((r) => r.mark)
      .filter((m): m is number => typeof m === "number");
    const top = numeric.length ? Math.max(...numeric) : null;
    return { total: rows.length, present, absent, top };
  }, [rows]);

  if (!sh || !eh || !ch) return null;
  if (!cls) return null;

  // Render a card offscreen with all rows, then capture as PNG.
  async function handleExportPng() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPng(true);
    try {
      const host = pdfHostRef.current;
      host.innerHTML = "";
      const slot = document.createElement("div");
      host.appendChild(slot);

      const { createRoot } = await import("react-dom/client");
      const root = createRoot(slot);
      await new Promise<void>((resolve) => {
        root.render(<ClassCard exam={exam!} rows={rows} theme={theme} className={cls!.name} />);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      // small extra wait so fonts and gradients settle
      await new Promise((r) => setTimeout(r, 120));

      const cardEl = slot.firstElementChild as HTMLElement | null;
      if (!cardEl) throw new Error("Could not render card");

      const dataUrl = await captureNode(cardEl);
      root.unmount();
      host.innerHTML = "";

      const link = document.createElement("a");
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      link.download = `wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}-all.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not export image: ${msg}`);
    } finally {
      setBusyPng(false);
    }
  }

  // PDF: 10 students per page.
  async function handleExportPdf() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPdf(true);
    try {
      const chunks: Row[][] = [];
      for (let i = 0; i < rows.length; i += PER_PAGE_PDF) {
        chunks.push(rows.slice(i, i + PER_PAGE_PDF));
      }
      if (chunks.length === 0) chunks.push([]);

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;

      const host = pdfHostRef.current;
      const { createRoot } = await import("react-dom/client");

      for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
        host.innerHTML = "";
        const slot = document.createElement("div");
        host.appendChild(slot);

        const root = createRoot(slot);
        await new Promise<void>((resolve) => {
          root.render(
            <ClassCard
              exam={exam!}
              rows={chunks[pageIdx]}
              theme={theme}
              className={cls!.name}
              compact
              pageInfo={{
                index: pageIdx,
                total: chunks.length,
                startRank: pageIdx * PER_PAGE_PDF,
              }}
            />,
          );
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        await new Promise((r) => setTimeout(r, 80));

        const cardEl = slot.firstElementChild as HTMLElement | null;
        if (!cardEl) {
          root.unmount();
          continue;
        }
        const dataUrl = await captureNode(cardEl);

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load page image"));
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
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not export PDF: ${msg}`);
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
      {/* Hero header + sticky actions */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 p-6 text-white shadow-card sm:p-8">
        <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/80">
              Result Sheet Studio
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Export {cls.name} Results
            </h1>
            <p className="mt-1 max-w-md text-sm text-white/85">
              Download a single beautiful <strong>PNG</strong> with all students, or a paginated{" "}
              <strong>PDF</strong> with 10 students per page.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleExportPng}
              disabled={!exam || busyPng}
              className="rounded-xl bg-white text-stone-900 shadow-soft hover:bg-white/90"
            >
              {busyPng ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <ImageDown className="mr-1 h-4 w-4" />
              )}
              {busyPng ? "Rendering…" : "PNG · all-in-one"}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!exam || busyPdf}
              className="rounded-xl bg-stone-900 text-white shadow-soft hover:bg-stone-800"
            >
              {busyPdf ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-1 h-4 w-4" />
              )}
              {busyPdf ? "Generating…" : "PDF · 10 / page"}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden offscreen host for paginated/all-in-one rendering */}
      <div
        ref={pdfHostRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: CARD_WIDTH,
          pointerEvents: "none",
          opacity: 0,
        }}
      />

      {/* Stats */}
      {exam && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Students" value={stats.total} accent="from-sky-400 to-cyan-300" />
          <StatCard label="Present" value={stats.present} accent="from-emerald-400 to-lime-300" />
          <StatCard label="Absent" value={stats.absent} accent="from-rose-400 to-pink-300" />
          <StatCard
            label="Top Mark"
            value={stats.top !== null ? `${stats.top}/${exam.totalMarks}` : "—"}
            accent="from-amber-400 to-orange-300"
          />
        </div>
      )}

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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {THEMES.map((t) => {
              const active = themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={cn(
                    "group relative flex items-center gap-2 overflow-hidden rounded-2xl border p-2 text-left text-xs font-medium transition-all",
                    active
                      ? "border-ink shadow-card ring-2 ring-ink/10"
                      : "border-border bg-canvas hover:border-ink/30",
                  )}
                  title={t.name}
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-xl ring-2 ring-white shadow-soft"
                    style={{ background: t.swatch }}
                  />
                  <span className="min-w-0 flex-1 truncate pr-1 text-ink">{t.name}</span>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 via-white to-violet-50 p-3 ring-1 ring-border sm:p-6">
        <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          <Download className="h-3 w-3" /> Live Preview
        </div>
        {exam && cls && (
          <div className="mx-auto w-full max-w-[720px] overflow-x-auto">
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className={cn("absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br opacity-30 blur-xl", accent)} />
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">{label}</div>
        <div className="mt-1 text-xl font-bold tabular-nums text-ink">{value}</div>
      </div>
    </div>
  );
}

type Row = { student: Student; mark: MarkStatus | undefined };

function ClassCard({
  exam,
  rows,
  theme,
  className,
  pageInfo,
  compact,
  ref,
}: {
  exam: Exam;
  rows: Row[];
  theme: Theme;
  className: string;
  pageInfo?: { index: number; total: number; startRank: number };
  compact?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const date = formatDate(exam.date);
  const present = rows.filter((r) => typeof r.mark === "number").length;
  const absent = rows.filter((r) => r.mark === "ab").length;
  const startRank = pageInfo?.startRank ?? 0;

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden rounded-3xl shadow-card", theme.cardBg)}
      style={{ width: CARD_WIDTH }}
    >
      {/* Header */}
      <div className={cn("relative px-8", theme.headerBg, compact ? "py-5" : "py-7")}>
        <div className={cn("text-[10px] font-bold uppercase tracking-[0.28em]", theme.subText)}>
          {CENTRE_NAME}
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className={cn("font-bold leading-tight tracking-tight", theme.headerText, compact ? "text-xl" : "text-2xl")}>
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
        {pageInfo && pageInfo.total > 1 && (
          <div className="absolute right-3 top-3 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold text-white">
            Page {pageInfo.index + 1} / {pageInfo.total}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={cn(compact ? "px-5 py-4" : "px-6 py-6", theme.bodyBg)}>
        <ul className={cn("flex flex-col", compact ? "gap-1" : "gap-2")}>
          {rows.map((r, i) => {
            const absoluteRank = startRank + i;
            const top = absoluteRank < 3 && typeof r.mark === "number";
            return (
              <li
                key={r.student.id}
                className={cn(
                  "flex items-center rounded-2xl",
                  compact ? "gap-2 px-3 py-1.5" : "gap-3 px-4 py-3",
                  top ? theme.topRowBg : i % 2 === 0 ? theme.rowBg : theme.rowAlt,
                )}
              >
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums",
                    compact ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs",
                    top ? theme.topRankChip : theme.rankChip,
                  )}
                >
                  {absoluteRank + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-tamil truncate font-semibold leading-tight",
                      compact ? "text-sm" : "text-base",
                      theme.rowText,
                    )}
                  >
                    {r.student.name}
                  </div>
                </div>
                <MarkPill mark={r.mark} total={exam.totalMarks} theme={theme} compact={compact} />
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
}

function MarkPill({
  mark,
  total,
  theme,
  compact,
}: {
  mark: MarkStatus | undefined;
  total: number;
  theme: Theme;
  compact?: boolean;
}) {
  const pad = compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  if (mark === "ab") {
    return (
      <span className={cn("font-tamil inline-flex items-center rounded-full font-semibold", pad, theme.markAb)}>
        வரவில்லை
      </span>
    );
  }
  if (mark === "no") {
    return (
      <span className={cn("font-tamil inline-flex items-center rounded-full font-semibold whitespace-nowrap", pad, theme.markNo)}>
        தேர்வு எழுதவில்லை
      </span>
    );
  }
  if (typeof mark === "number") {
    const pct = (mark / total) * 100;
    const tone =
      pct >= 90 ? theme.markHi : pct >= 75 ? theme.markMid : pct >= 50 ? theme.markLow : theme.markFail;
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1 rounded-full font-bold tabular-nums",
          compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          tone,
        )}
      >
        {mark}
        <span className="text-[10px] font-medium opacity-70">/ {total}</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center rounded-full bg-stone-100 text-stone-500", pad)}>
      —
    </span>
  );
}
