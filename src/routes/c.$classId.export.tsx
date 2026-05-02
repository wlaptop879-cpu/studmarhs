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
import { Download, FileText, Sparkles, Check, Loader2, ImageDown, GraduationCap, Calendar, ClipboardList, Trophy, Award, Star, BookOpen } from "lucide-react";
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
  // Header gradient (left -> right)
  gradFrom: string;
  gradTo: string;
  // Ribbon (top-right badge) color
  ribbon: string;
  // Accent color used for icons / brand text / percentage pill
  accent: string;
  accentSoft: string; // light tint of accent for icon circles & pill bg
  accentText: string; // text color on accentSoft
  // Page background tint behind the card body (subtle)
  pageBg: string;
  // Medal colors for top 3
  gold: string;
  silver: string;
  bronze: string;
};

const THEMES: Theme[] = [
  {
    id: "azure",
    name: "Azure Blue",
    swatch: "linear-gradient(135deg,#3b82f6,#1d4ed8,#1e3a8a)",
    gradFrom: "#3b82f6",
    gradTo: "#1e40af",
    ribbon: "#1e3a8a",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    accentText: "#1e3a8a",
    pageBg: "#f8fafc",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "sunrise",
    name: "Sunrise",
    swatch: "linear-gradient(135deg,#fb923c,#f59e0b,#ec4899)",
    gradFrom: "#fb923c",
    gradTo: "#ec4899",
    ribbon: "#9a3412",
    accent: "#ea580c",
    accentSoft: "#ffedd5",
    accentText: "#7c2d12",
    pageBg: "#fff7ed",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: "linear-gradient(135deg,#0ea5e9,#06b6d4,#22d3ee)",
    gradFrom: "#0ea5e9",
    gradTo: "#0e7490",
    ribbon: "#155e75",
    accent: "#0891b2",
    accentSoft: "#cffafe",
    accentText: "#155e75",
    pageBg: "#f0f9ff",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "forest",
    name: "Forest",
    swatch: "linear-gradient(135deg,#16a34a,#84cc16,#a3e635)",
    gradFrom: "#16a34a",
    gradTo: "#365314",
    ribbon: "#14532d",
    accent: "#15803d",
    accentSoft: "#dcfce7",
    accentText: "#14532d",
    pageBg: "#f0fdf4",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: "linear-gradient(135deg,#1e1b4b,#4c1d95,#7c3aed)",
    gradFrom: "#1e1b4b",
    gradTo: "#6d28d9",
    ribbon: "#312e81",
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
    accentText: "#4c1d95",
    pageBg: "#faf5ff",
    gold: "#fbbf24",
    silver: "#a1a1aa",
    bronze: "#d97706",
  },
  {
    id: "rose",
    name: "Rose Petal",
    swatch: "linear-gradient(135deg,#f43f5e,#ec4899,#f472b6)",
    gradFrom: "#f43f5e",
    gradTo: "#be185d",
    ribbon: "#881337",
    accent: "#e11d48",
    accentSoft: "#ffe4e6",
    accentText: "#881337",
    pageBg: "#fff1f2",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "royal",
    name: "Royal",
    swatch: "linear-gradient(135deg,#581c87,#7c3aed,#fbbf24)",
    gradFrom: "#6b21a8",
    gradTo: "#b45309",
    ribbon: "#4c1d95",
    accent: "#7c3aed",
    accentSoft: "#f3e8ff",
    accentText: "#581c87",
    pageBg: "#faf5ff",
    gold: "#f59e0b",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "minimal",
    name: "Minimal Mono",
    swatch: "linear-gradient(135deg,#525252,#171717,#000000)",
    gradFrom: "#404040",
    gradTo: "#0a0a0a",
    ribbon: "#171717",
    accent: "#171717",
    accentSoft: "#f5f5f5",
    accentText: "#171717",
    pageBg: "#fafafa",
    gold: "#a3a3a3",
    silver: "#d4d4d4",
    bronze: "#737373",
  },
  {
    id: "sunset",
    name: "Sunset Gold",
    swatch: "linear-gradient(135deg,#dc2626,#ea580c,#facc15)",
    gradFrom: "#dc2626",
    gradTo: "#ea580c",
    ribbon: "#7f1d1d",
    accent: "#dc2626",
    accentSoft: "#fee2e2",
    accentText: "#7f1d1d",
    pageBg: "#fff7ed",
    gold: "#f59e0b",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
  {
    id: "graphite",
    name: "Graphite Teal",
    swatch: "linear-gradient(135deg,#1f2937,#0d9488,#5eead4)",
    gradFrom: "#1f2937",
    gradTo: "#0f766e",
    ribbon: "#134e4a",
    accent: "#0d9488",
    accentSoft: "#ccfbf1",
    accentText: "#134e4a",
    pageBg: "#f8fafc",
    gold: "#f5b700",
    silver: "#9ca3af",
    bronze: "#c2671a",
  },
];

const PER_PAGE_PDF = 10;
const CARD_WIDTH = 720;

async function captureNode(node: HTMLElement, desiredScale = 2.3): Promise<string> {
  const maxSide = 14000;
  const longestSide = Math.max(node.scrollWidth, node.scrollHeight, 1);
  const safeScale = Math.max(1.35, Math.min(desiredScale, maxSide / longestSide));
  const canvas = await html2canvas(node, {
    scale: safeScale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: node.scrollWidth,
    height: node.scrollHeight,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });
  return canvas.toDataURL("image/png");
}

function saveDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function ExportPage() {
  const { classId } = Route.useParams();
  const { examId } = Route.useSearch();
  const { classes, hydrated: ch } = useClasses();
  const { students, hydrated: sh } = useStudents(classId);
  const { exams, hydrated: eh } = useExams(classId);
  const [activeId, setActiveId] = useState<string>(examId);
  const [themeId, setThemeId] = useState<string>("azure");
  const [sort, setSort] = useState<SortId>("high");
  const cardRef = useRef<HTMLDivElement>(null);
  const pdfHostRef = useRef<HTMLDivElement>(null);
  const [busyPng, setBusyPng] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  type Progress = {
    kind: "pdf" | "png";
    phase: "queued" | "rendering" | "composing" | "saving" | "done" | "failed";
    current: number;
    total: number;
    message?: string;
  };
  const [progress, setProgress] = useState<Progress | null>(null);

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
    setProgress({ kind: "png", phase: "queued", current: 0, total: 1, message: "Preparing canvas…" });
    try {
      const host = pdfHostRef.current;
      host.innerHTML = "";
      const slot = document.createElement("div");
      host.appendChild(slot);

      const { createRoot } = await import("react-dom/client");
      const root = createRoot(slot);
      setProgress({ kind: "png", phase: "rendering", current: 0, total: 1, message: `Rendering ${rows.length} students…` });
      await new Promise<void>((resolve) => {
        root.render(<ClassCard exam={exam!} rows={rows} theme={theme} className={cls!.name} />);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise((r) => setTimeout(r, 120));

      const cardEl = slot.firstElementChild as HTMLElement | null;
      if (!cardEl) throw new Error("Could not render card");

      setProgress({ kind: "png", phase: "composing", current: 1, total: 1, message: "Capturing image…" });
      const dataUrl = await captureNode(cardEl);
      root.unmount();
      host.innerHTML = "";

      setProgress({ kind: "png", phase: "saving", current: 1, total: 1, message: "Saving file…" });
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      saveDataUrl(dataUrl, `wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}-all.png`);
      setProgress({ kind: "png", phase: "done", current: 1, total: 1, message: "Done!" });
      toast.success("Image downloaded");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setProgress((p) => (p ? { ...p, phase: "failed", message: msg } : null));
      toast.error(`Could not export image: ${msg}`);
    } finally {
      setBusyPng(false);
      setTimeout(() => setProgress(null), 1200);
    }
  }

  // PDF: same modern canvas design, 10 students per page for A4 readability.
  async function handleExportPdf() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPdf(true);
    try {
      const chunks: Row[][] = [];
      for (let i = 0; i < rows.length; i += PER_PAGE_PDF) {
        chunks.push(rows.slice(i, i + PER_PAGE_PDF));
      }
      if (chunks.length === 0) chunks.push([]);

      setProgress({ kind: "pdf", phase: "queued", current: 0, total: chunks.length, message: "Queued…" });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;

      const host = pdfHostRef.current;
      const { createRoot } = await import("react-dom/client");

      for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
        setProgress({
          kind: "pdf",
          phase: "rendering",
          current: pageIdx + 1,
          total: chunks.length,
          message: `Rendering page ${pageIdx + 1} of ${chunks.length}…`,
        });
        host.innerHTML = "";
        const slot = document.createElement("div");
        host.appendChild(slot);

        const root = createRoot(slot);
        await new Promise<void>((resolve) => {
          root.render(
            <ClassCard
              exam={exam!}
              rows={chunks[pageIdx]}
              analysisRows={rows}
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
        setProgress({
          kind: "pdf",
          phase: "composing",
          current: pageIdx + 1,
          total: chunks.length,
          message: `Capturing page ${pageIdx + 1} of ${chunks.length}…`,
        });
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
      setProgress({
        kind: "pdf",
        phase: "saving",
        current: chunks.length,
        total: chunks.length,
        message: "Saving PDF file…",
      });
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      pdf.save(`wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}.pdf`);
      setProgress({
        kind: "pdf",
        phase: "done",
        current: chunks.length,
        total: chunks.length,
        message: "Done!",
      });
      toast.success(`PDF downloaded · ${chunks.length} page${chunks.length > 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setProgress((p) => (p ? { ...p, phase: "failed", message: msg } : null));
      toast.error(`Could not export PDF: ${msg}`);
    } finally {
      setBusyPdf(false);
      setTimeout(() => setProgress(null), 1400);
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

  const pct = progress
    ? progress.phase === "queued"
      ? 5
      : progress.phase === "done" || progress.phase === "failed"
        ? 100
        : Math.min(98, Math.round((progress.current / Math.max(progress.total, 1)) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {progress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 p-6 text-white shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-card">
                {progress.phase === "done" ? (
                  <Check className="h-6 w-6" />
                ) : progress.phase === "failed" ? (
                  <span className="text-lg font-bold">!</span>
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-200/80">
                  {progress.kind === "pdf" ? "Generating PDF" : "Generating Image"}
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold">
                  {progress.phase === "queued" && "Queued — preparing job"}
                  {progress.phase === "rendering" &&
                    (progress.kind === "pdf"
                      ? `Rendering page ${progress.current} of ${progress.total}`
                      : "Rendering layout")}
                  {progress.phase === "composing" && "Capturing canvas"}
                  {progress.phase === "saving" && "Saving file"}
                  {progress.phase === "done" && "Export complete"}
                  {progress.phase === "failed" && "Export failed"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tabular-nums">{pct}%</div>
                {progress.kind === "pdf" && (
                  <div className="text-[10px] uppercase tracking-wider text-violet-200/70">
                    {progress.current}/{progress.total} pages
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  progress.phase === "failed"
                    ? "bg-gradient-to-r from-rose-500 to-red-500"
                    : "bg-gradient-to-r from-emerald-400 via-violet-400 to-fuchsia-500",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
              {(["queued", "rendering", "composing", "saving"] as const).map((step) => {
                const order = ["queued", "rendering", "composing", "saving", "done"];
                const currentIdx = order.indexOf(progress.phase);
                const stepIdx = order.indexOf(step);
                const active = stepIdx <= currentIdx || progress.phase === "done";
                return (
                  <div
                    key={step}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-center transition-colors",
                      active ? "bg-white/15 text-white" : "bg-white/5 text-white/40",
                    )}
                  >
                    {step}
                  </div>
                );
              })}
            </div>

            {progress.message && (
              <p
                className={cn(
                  "mt-4 text-xs",
                  progress.phase === "failed" ? "text-rose-300" : "text-violet-100/80",
                )}
              >
                {progress.message}
              </p>
            )}
          </div>
        </div>
      )}

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
              <strong>PDF</strong> with 10 students per page for clean A4 printing.
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
          visibility: "visible",
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
  analysisRows,
  theme,
  className,
  pageInfo,
  compact,
  ref,
}: {
  exam: Exam;
  rows: Row[];
  analysisRows?: Row[];
  theme: Theme;
  className: string;
  pageInfo?: { index: number; total: number; startRank: number };
  compact?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const date = formatDate(exam.date);
  const reportRows = analysisRows ?? rows;
  const numericMarks = reportRows
    .map((r) => r.mark)
    .filter((m): m is number => typeof m === "number");
  const present = numericMarks.length;
  const absent = reportRows.filter((r) => r.mark === "ab").length;
  const notWritten = reportRows.filter((r) => r.mark === "no").length;
  const total = reportRows.length;
  const topMark = numericMarks.length ? Math.max(...numericMarks) : 0;
  const fullMarkCount = numericMarks.filter((m) => m === exam.totalMarks).length;
  const avgMark = numericMarks.length
    ? numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length
    : 0;
  const avgPct = exam.totalMarks ? (avgMark / exam.totalMarks) * 100 : 0;
  const passCount = numericMarks.filter((m) => m / exam.totalMarks >= 0.4).length;
  const passRate = present ? (passCount / present) * 100 : 0;
  const startRank = pageInfo?.startRank ?? 0;
  const headerGradient = `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`;

  // Distribution buckets (based on numeric marks)
  const buckets = [
    { label: "90-100", min: 90, color: "#10b981" },
    { label: "75-89", min: 75, color: "#22c55e" },
    { label: "60-74", min: 60, color: "#eab308" },
    { label: "40-59", min: 40, color: "#f97316" },
    { label: "0-39", min: 0, color: "#ef4444" },
  ].map((b, idx, arr) => {
    const next = arr[idx - 1]?.min ?? 101;
    const count = numericMarks.filter((m) => {
      const p = (m / exam.totalMarks) * 100;
      return p >= b.min && p < next;
    }).length;
    return { ...b, count };
  });
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div
      ref={ref}
      style={{ width: CARD_WIDTH, backgroundColor: theme.pageBg }}
      className="overflow-hidden rounded-[28px] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)]"
    >
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-7 pt-6 pb-8"
        style={{ background: headerGradient }}
      >
        <div
          className="absolute -right-20 -top-20 h-56 w-56 rounded-full"
          style={{ background: "rgba(255,255,255,0.12)" }}
        />
        <div
          className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full"
          style={{ background: "rgba(0,0,0,0.10)" }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }}
            >
              <GraduationCap className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/80">
                Performance Report
              </div>
              <div className="mt-0.5 text-[18px] font-bold tracking-tight text-white truncate">
                {CENTRE_NAME}
              </div>
            </div>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(255,255,255,0.22)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }}
          >
            <Trophy className="h-6 w-6 text-white" fill="rgba(255,255,255,0.35)" strokeWidth={2} />
          </div>
        </div>

        {/* Subject + meta */}
        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2
              className={cn(
                "font-bold tracking-tight text-white",
                compact ? "text-3xl" : "text-[42px] leading-[1.05]",
              )}
            >
              {exam.subject}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                <BookOpen className="h-3.5 w-3.5" /> {className}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                <Calendar className="h-3.5 w-3.5" /> {date}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25">
                <ClipboardList className="h-3.5 w-3.5" /> /{exam.totalMarks}
              </span>
            </div>
          </div>

          {/* Avg ring */}
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-2xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.18)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.28)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85">
              Class Avg
            </div>
            <div className="text-2xl font-bold tabular-nums text-white">
              {avgPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {pageInfo && pageInfo.total > 1 && (
          <div className="absolute right-4 top-3 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-bold text-white">
            Page {pageInfo.index + 1} / {pageInfo.total}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-white px-7 pt-6 pb-7">
        {/* KPI grid */}
        <div className="grid grid-cols-4 gap-3">
          <KpiTile label="Students" value={total} accent={theme.accent} accentSoft={theme.accentSoft} icon={<BookOpen className="h-4 w-4" />} />
          <KpiTile label="Present" value={present} accent="#059669" accentSoft="#d1fae5" icon={<Check className="h-4 w-4" />} />
          <KpiTile label="Absent" value={absent + notWritten} accent="#dc2626" accentSoft="#fee2e2" icon={<Star className="h-4 w-4" />} />
          <KpiTile label="Top Score" value={`${topMark}/${exam.totalMarks}`} accent={theme.accent} accentSoft={theme.accentSoft} icon={<Trophy className="h-4 w-4" />} />
        </div>

        {/* Analytics row: distribution + pass rate */}
        <div className="mt-5 grid grid-cols-5 gap-3">
          {/* Distribution chart */}
          <div className="col-span-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Score Distribution
              </div>
              <div className="text-[10px] font-semibold text-slate-400">% bands</div>
            </div>
            <div className="mt-3 flex h-24 items-end gap-2">
              {buckets.map((b) => {
                const h = (b.count / maxBucket) * 100;
                return (
                  <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                    <div className="text-[10px] font-bold tabular-nums text-slate-700">
                      {b.count}
                    </div>
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${Math.max(h, 4)}%`,
                        background: b.color,
                        minHeight: 4,
                      }}
                    />
                    <div className="text-[9px] font-semibold text-slate-500">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pass rate ring */}
          <div className="col-span-2 flex flex-col rounded-2xl p-4 ring-1 ring-slate-200/70" style={{ background: theme.accentSoft }}>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accentText }}>
              Pass Rate
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${theme.accent} ${passRate * 3.6}deg, rgba(255,255,255,0.7) 0deg)`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: theme.accent }}>
                    {passRate.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-[12px] leading-tight">
                <div className="font-bold" style={{ color: theme.accentText }}>
                  {passCount} / {present}
                </div>
                <div className="text-slate-600">scored ≥ 40%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ranked table */}
        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
          <div
            className="grid grid-cols-[70px_1fr_120px_130px] items-center px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
            style={{ background: headerGradient }}
          >
            <div>Rank</div>
            <div>Student</div>
            <div className="text-right">Score</div>
            <div className="text-right">Percent</div>
          </div>

          <div className="bg-white">
            {rows.map((r, i) => {
              const absoluteRank = startRank + i;
              const medal =
                absoluteRank === 0
                  ? theme.gold
                  : absoluteRank === 1
                    ? theme.silver
                    : absoluteRank === 2
                      ? theme.bronze
                      : null;
              const zebra = i % 2 === 1 ? "#fafafa" : "#ffffff";
              return (
                <div
                  key={r.student.id}
                  className={cn(
                    "grid grid-cols-[70px_1fr_120px_130px] items-center border-t border-slate-100 px-5",
                    compact ? "py-2" : "py-3",
                  )}
                  style={{ background: zebra }}
                >
                  <div className="flex items-center">
                    {medal ? (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: medal, boxShadow: `0 4px 12px -4px ${medal}` }}
                      >
                        {absoluteRank + 1}
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {absoluteRank + 1}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "font-tamil truncate font-semibold text-slate-900",
                      compact ? "text-sm" : "text-base",
                    )}
                  >
                    {r.student.name}
                  </div>

                  <div className="text-right text-sm font-semibold text-slate-700 tabular-nums">
                    <ScoreText mark={r.mark} total={exam.totalMarks} />
                  </div>

                  <div className="flex justify-end">
                    <MarkPill mark={r.mark} total={exam.totalMarks} theme={theme} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: theme.accentSoft }}
            >
              <Star className="h-3.5 w-3.5" style={{ color: theme.accent }} fill="currentColor" />
            </div>
            <span className="font-bold" style={{ color: theme.accent }}>
              Wisdom Maths
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">Analytics Report</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">
            Generated {new Date().toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  accent,
  accentSoft,
  icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  accentSoft: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200"
      style={{ boxShadow: "0 6px 18px -10px rgba(15,23,42,0.2)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: accentSoft, color: accent }}
        >
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </div>
      </div>
      <div className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

function InfoChip({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="text-base font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ScoreText({ mark, total }: { mark: MarkStatus | undefined; total: number }) {
  if (mark === "ab") return <span className="font-tamil text-rose-600">வரவில்லை</span>;
  if (mark === "no") return <span className="font-tamil text-slate-500">—</span>;
  if (typeof mark === "number")
    return (
      <>
        {mark} <span className="text-slate-400">/ {total}</span>
      </>
    );
  return <span className="text-slate-400">—</span>;
}

function MarkPill({
  mark,
  total,
  theme,
}: {
  mark: MarkStatus | undefined;
  total: number;
  theme: Theme;
}) {
  if (typeof mark === "number") {
    const pct = (mark / total) * 100;
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums"
        style={{ background: theme.accentSoft, color: theme.accentText }}
      >
        {pct.toFixed(2)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-400">
      —
    </span>
  );
}
