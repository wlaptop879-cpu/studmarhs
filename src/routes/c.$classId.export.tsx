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
  leastMarkStorageKey,
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
import {
  Download,
  FileText,
  Sparkles,
  Check,
  Loader2,
  ImageDown,
  GraduationCap,
  Calendar,
  ClipboardList,
  Trophy,
  Star,
} from "lucide-react";
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

const CARD_WIDTH = 720;

function inlineComputedStyles(source: Element, clone: Element) {
  const sourceElements = [source, ...Array.from(source.querySelectorAll("*"))];
  const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))];

  sourceElements.forEach((sourceEl, index) => {
    const cloneEl = cloneElements[index] as HTMLElement | SVGElement | undefined;
    if (!cloneEl) return;

    const styles = window.getComputedStyle(sourceEl);
    for (let i = 0; i < styles.length; i++) {
      const property = styles.item(i);
      cloneEl.style.setProperty(
        property,
        styles.getPropertyValue(property),
        styles.getPropertyPriority(property),
      );
    }
  });
}

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
    onclone: (doc, clonedElement) => {
      inlineComputedStyles(node, clonedElement);
      const html = doc.documentElement;
      html.style.setProperty("background", "#ffffff");
      doc.body.style.setProperty("background", "#ffffff");
      doc.body.style.setProperty("margin", "0");
    },
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
  const [leastMarkLimit, setLeastMarkLimit] = useState<number | null>(null);
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

  useEffect(() => {
    if (!activeId || typeof window === "undefined") {
      setLeastMarkLimit(null);
      return;
    }
    const raw = window.localStorage.getItem(leastMarkStorageKey(activeId));
    const parsed = raw ? Number(raw) : Number.NaN;
    setLeastMarkLimit(Number.isFinite(parsed) ? parsed : null);
  }, [activeId]);

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
    const numeric = rows.map((r) => r.mark).filter((m): m is number => typeof m === "number");
    const top = numeric.length ? Math.max(...numeric) : null;
    return { total: rows.length, present, absent, top };
  }, [rows]);

  if (!sh || !eh || !ch) return null;
  if (!cls) return null;

  // PNG: render an offscreen full-width card (all students) so the export
  // is high-resolution and never split, regardless of phone screen width.
  async function handleExportPng() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPng(true);
    setProgress({
      kind: "png",
      phase: "queued",
      current: 0,
      total: 1,
      message: "Preparing canvas…",
    });
    try {
      const host = pdfHostRef.current;
      host.innerHTML = "";
      const slot = document.createElement("div");
      slot.style.width = `${CARD_WIDTH}px`;
      host.appendChild(slot);

      setProgress({
        kind: "png",
        phase: "rendering",
        current: 1,
        total: 1,
        message: `Rendering ${rows.length} students…`,
      });
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(slot);
      await new Promise<void>((resolve) => {
        root.render(
          <ClassCard
            exam={exam!}
            rows={rows}
            analysisRows={rows}
            theme={theme}
            className={cls!.name}
            leastMarkLimit={leastMarkLimit}
          />,
        );
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise((r) => setTimeout(r, 100));

      const cardEl = slot.firstElementChild as HTMLElement | null;
      if (!cardEl) throw new Error("Could not render card");

      setProgress({
        kind: "png",
        phase: "composing",
        current: 1,
        total: 1,
        message: "Capturing high-resolution image…",
      });
      const dataUrl = await captureNode(cardEl, 3);

      setProgress({ kind: "png", phase: "saving", current: 1, total: 1, message: "Saving file…" });
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      saveDataUrl(dataUrl, `wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}-all.png`);
      root.unmount();
      host.innerHTML = "";
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

  // PDF: render the same full result card once, then scale it to fit one A4 page.
  async function handleExportPdf() {
    if (!exam || !cls || !pdfHostRef.current) return;
    setBusyPdf(true);
    try {
      setProgress({
        kind: "pdf",
        phase: "queued",
        current: 0,
        total: 1,
        message: "Queued…",
      });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pageW - margin * 2;

      const host = pdfHostRef.current;
      const { createRoot } = await import("react-dom/client");

      setProgress({
        kind: "pdf",
        phase: "rendering",
        current: 1,
        total: 1,
        message: `Rendering ${rows.length} students on one page…`,
      });
      host.innerHTML = "";
      const slot = document.createElement("div");
      slot.style.width = `${CARD_WIDTH}px`;
      host.appendChild(slot);

      const root = createRoot(slot);
      await new Promise<void>((resolve) => {
        root.render(
          <ClassCard
            exam={exam!}
            rows={rows}
            analysisRows={rows}
            theme={theme}
            className={cls!.name}
            leastMarkLimit={leastMarkLimit}
          />,
        );
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise((r) => setTimeout(r, 80));

      const cardEl = slot.firstElementChild as HTMLElement | null;
      if (!cardEl) throw new Error("Could not render PDF card");
      setProgress({
        kind: "pdf",
        phase: "composing",
        current: 1,
        total: 1,
        message: "Capturing one-page PDF…",
      });
      const dataUrl = await captureNode(cardEl);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load page image"));
        img.src = dataUrl;
      });
      const ratio = img.height / img.width;
      const maxH = pageH - margin * 2;
      let drawW = usableW;
      let drawH = drawW * ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH / ratio;
      }
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH);

      root.unmount();

      host.innerHTML = "";
      setProgress({
        kind: "pdf",
        phase: "saving",
        current: 1,
        total: 1,
        message: "Saving PDF file…",
      });
      const safe = exam.subject.replace(/[^a-z0-9_-]+/gi, "_");
      pdf.save(`wisdom-${cls.name.replace(/\s+/g, "")}-${safe}-${theme.id}.pdf`);
      setProgress({
        kind: "pdf",
        phase: "done",
        current: 1,
        total: 1,
        message: "Done!",
      });
      toast.success("PDF downloaded · 1 page");
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
              Download a single beautiful <strong>PNG</strong> with all students, or a one-page{" "}
              <strong>PDF</strong> scaled to fit all results.
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
              {busyPdf ? "Generating…" : "PDF · one page"}
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
          left: -99999,
          top: 0,
          width: CARD_WIDTH,
          pointerEvents: "none",
          visibility: "visible",
          zIndex: -1,
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
            <Label className="text-xs font-medium text-ink-muted">Export order</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortId)}>
              <SelectTrigger className="mt-1 rounded-xl border-border bg-canvas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High → Low, then NO, then AB</SelectItem>
                <SelectItem value="low">Low → High, then NO, then AB</SelectItem>
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
              leastMarkLimit={leastMarkLimit}
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
      <div
        className={cn(
          "absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br opacity-30 blur-xl",
          accent,
        )}
      />
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </div>
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
  leastMarkLimit,
  pageInfo,
  compact: _compact,
  ref,
}: {
  exam: Exam;
  rows: Row[];
  analysisRows?: Row[];
  theme: Theme;
  className: string;
  leastMarkLimit?: number | null;
  pageInfo?: { index: number; total: number; startRank: number };
  compact?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const date = formatDate(exam.date);
  const reportRows = analysisRows ?? rows;

  // Column 2: lowest scorers — sorted worst → best (low → high)
  const lowest = reportRows
    .filter(
      (r) =>
        typeof r.mark === "number" &&
        r.mark < exam.totalMarks &&
        (leastMarkLimit === null || leastMarkLimit === undefined || r.mark <= leastMarkLimit),
    )
    .sort((a, b) => (a.mark as number) - (b.mark as number));

  // Column 1: top scorers — sorted best → worst (high → low)
  const column1 = reportRows
    .filter(
      (r) =>
        typeof r.mark === "number" &&
        (leastMarkLimit === null || leastMarkLimit === undefined
          ? r.mark === exam.totalMarks
          : r.mark > leastMarkLimit),
    )
    .sort((a, b) => (b.mark as number) - (a.mark as number));

  // Column 3 split: NO = did-not-write, Column 4: AB = absent
  const noWrite = reportRows.filter((r) => r.mark === "no");
  const absentOnly = reportRows.filter((r) => r.mark === "ab");

  // Continuous S.No across columns
  let snoCounter = 0;
  const withSno = (list: Row[]) =>
    list.map((r) => {
      snoCounter += 1;
      return { row: r, sno: snoCounter };
    });
  const c1 = withSno(column1);
  const c2 = withSno(lowest);
  const c3 = withSno(noWrite);
  const c4 = withSno(absentOnly);

  return (
    <div
      ref={ref}
      style={{ width: CARD_WIDTH, backgroundColor: "#f8fafc", padding: 14 }}
      className="overflow-hidden rounded-[20px]"
    >
      {/* ===== Top dark navy banner ===== */}
      <div
        className="relative overflow-hidden rounded-[16px] px-5 pt-4 pb-3"
        style={{
          background: "linear-gradient(135deg,#0b1f4d 0%,#142b6e 50%,#1a3a8a 100%)",
          boxShadow: "0 8px 24px -10px rgba(11,31,77,0.5)",
        }}
      >
        {/* Decorative corner dots */}
        <div
          className="absolute left-2 top-2 h-10 w-10 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fbbf24 1.5px, transparent 1.5px)",
            backgroundSize: "6px 6px",
          }}
        />
        <div
          className="absolute right-2 bottom-2 h-10 w-10 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fbbf24 1.5px, transparent 1.5px)",
            backgroundSize: "6px 6px",
          }}
        />

        <div className="relative flex items-center gap-3">
          {/* Left graduation icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #fde68a, #f59e0b 70%, #b45309)",
              boxShadow: "0 4px 12px -2px rgba(245,158,11,0.5)",
            }}
          >
            <GraduationCap className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>

          {/* Center title */}
          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Star className="h-3 w-3 text-amber-300" fill="#fbbf24" />
              <Star className="h-4 w-4 text-amber-300" fill="#fbbf24" />
              <Star className="h-3 w-3 text-amber-300" fill="#fbbf24" />
            </div>
            <div
              className="font-tamil mt-0.5 text-[22px] font-bold leading-tight text-white"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
            >
              விஸ்டம் மேக்ஸ் டியூஷன் சென்டர்
            </div>
            <div className="mt-0.5 text-[10px] font-bold tracking-[0.25em] text-amber-200">
              ─ {CENTRE_NAME.toUpperCase()} ─
            </div>
          </div>

          {/* Right trophy */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #fde68a, #f59e0b 70%, #b45309)",
              boxShadow: "0 4px 12px -2px rgba(245,158,11,0.5)",
            }}
          >
            <Trophy
              className="h-8 w-8 text-white"
              fill="rgba(255,255,255,0.4)"
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Info pills row */}
        <div className="relative mt-3 grid grid-cols-3 gap-2">
          <InfoPill
            icon={<Calendar className="h-4 w-4" style={{ color: "#0b1f4d" }} />}
            iconBg="#dbeafe"
            label="தேதி"
            value={date}
          />
          <InfoPill
            icon={<GraduationCap className="h-4 w-4" style={{ color: "#0b1f4d" }} />}
            iconBg="#dbeafe"
            label="வகுப்பு"
            value={className}
          />
          <InfoPill
            icon={<Trophy className="h-4 w-4" style={{ color: "#92400e" }} />}
            iconBg="#fef3c7"
            label="மொத்த மதிப்பெண்"
            value={String(exam.totalMarks)}
          />
        </div>

        {pageInfo && pageInfo.total > 1 && (
          <div className="absolute right-3 top-1 rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-bold text-white">
            Page {pageInfo.index + 1} / {pageInfo.total}
          </div>
        )}
      </div>

      {/* ===== Result columns ===== */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <ResultColumn
          headerColor="#16a34a"
          headerSoft="#dcfce7"
          headerIcon={<Trophy className="h-3.5 w-3.5 text-white" fill="#fbbf24" />}
          title="ஆக சிறந்த மாணவர்கள்"
          titleSuffix={<Star className="ml-1 inline h-3 w-3" fill="#fbbf24" color="#fbbf24" />}
          items={c1}
          totalMarks={exam.totalMarks}
          footerBg="#f0fdf4"
          footerColor="#166534"
          footerIcon={<Star className="h-3 w-3" fill="#16a34a" color="#16a34a" />}
          footerText="வெற்றி என்பது தயாரிப்பும், முயற்சியும், விட்டாமயற்சியும் சேர்ந்த பலன்!"
        />
        <ResultColumn
          headerColor="#dc2626"
          headerSoft="#fee2e2"
          headerIcon={<span className="text-[12px] font-bold text-white">!</span>}
          title="கடைசி மதிப்பெண் பெற்றவர்கள்"
          items={c2}
          totalMarks={exam.totalMarks}
          footerBg="#fef2f2"
          footerColor="#991b1b"
          footerIcon={<span className="text-sm">😔</span>}
          footerText="தோல்வி என்பது முடிவு அல்ல, மீண்டும் முயற்சி செய்ய ஒரு வாய்ப்பு!"
        />
        <ResultColumn
          headerColor="#2563eb"
          headerSoft="#dbeafe"
          headerIcon={<ClipboardList className="h-3.5 w-3.5 text-white" />}
          title="தேர்வு எழுதாத மாணவர்கள்"
          items={c3}
          totalMarks={exam.totalMarks}
          isAbsent
          footerBg="#eff6ff"
          footerColor="#1e3a8a"
          footerIcon={<span className="text-sm">👥</span>}
          footerText="தேர்வு எழுதுவது ஒரு நாள் இருக்கலாம், அதன் பயணம் தொடர்ட்டும்!"
        />
        <ResultColumn
          headerColor="#9333ea"
          headerSoft="#ede9fe"
          headerIcon={<span className="text-[10px] font-bold text-white">AB</span>}
          title="வரவில்லை (Absent)"
          items={c4}
          totalMarks={exam.totalMarks}
          isAbsent
          footerBg="#faf5ff"
          footerColor="#581c87"
          footerIcon={<span className="text-sm">📝</span>}
          footerText="வரவில்லை என்பது தற்காலிகமான இடைவெளி மட்டுமே!"
        />
      </div>

      {/* ===== Bottom motivational ribbon ===== */}
      <div
        className="mt-3 flex items-center justify-center gap-2 rounded-[12px] px-4 py-2"
        style={{
          background: "linear-gradient(90deg,#0b1f4d,#1a3a8a,#0b1f4d)",
          boxShadow: "0 4px 12px -4px rgba(11,31,77,0.4)",
        }}
      >
        <Star className="h-3.5 w-3.5 text-amber-300" fill="#fbbf24" />
        <span className="font-tamil text-[13px] font-bold text-white">
          முயற்சி செய்! முன்னேறு! வெற்றி நிச்சயம்!
        </span>
        <Star className="h-3.5 w-3.5 text-amber-300" fill="#fbbf24" />
      </div>
    </div>
  );
}

function InfoPill({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] px-2 py-1.5"
      style={{
        background: "rgba(255,255,255,0.95)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="font-tamil text-[10px] font-semibold text-slate-600">{label}</div>
        <div className="font-tamil truncate text-[12px] font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ResultColumn({
  headerColor,
  headerSoft,
  headerIcon,
  title,
  titleSuffix,
  items,
  totalMarks,
  isAbsent,
  footerBg,
  footerColor,
  footerIcon,
  footerText,
}: {
  headerColor: string;
  headerSoft: string;
  headerIcon: React.ReactNode;
  title: string;
  titleSuffix?: React.ReactNode;
  items: { row: Row; sno: number }[];
  totalMarks: number;
  isAbsent?: boolean;
  footerBg: string;
  footerColor: string;
  footerIcon: React.ReactNode;
  footerText: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[12px] bg-white"
      style={{
        boxShadow: "0 4px 14px -6px rgba(15,23,42,0.18)",
        border: `1px solid ${headerSoft}`,
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ background: headerSoft }}
      >
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ background: headerColor }}
        >
          {headerIcon}
        </div>
        <div
          className="font-tamil flex-1 text-center text-[11px] font-bold leading-tight"
          style={{ color: headerColor }}
        >
          {title}
          {titleSuffix}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 bg-white">
        {items.length === 0 ? (
          <div className="font-tamil px-2 py-4 text-center text-[10px] text-slate-400">
            —
          </div>
        ) : (
          items.map(({ row, sno }, i) => {
            const zebra = i % 2 === 1 ? "#fafafa" : "#ffffff";
            const display = isAbsent
              ? "-"
              : typeof row.mark === "number"
                ? String(row.mark)
                : row.mark === "ab"
                  ? "AB"
                  : row.mark === "no"
                    ? "—"
                    : "—";
            return (
              <div
                key={row.student.id}
                className="flex items-center gap-1.5 px-2 py-1"
                style={{ background: zebra, borderTop: "1px solid #f1f5f9" }}
              >
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white tabular-nums"
                  style={{ background: headerColor }}
                >
                  {sno}
                </div>
                <div className="font-tamil flex-1 truncate text-[11px] font-semibold text-slate-800">
                  {row.student.name}
                </div>
                <div
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: row.mark === totalMarks && !isAbsent ? "#16a34a" : "#334155" }}
                >
                  {display}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-start gap-1.5 px-2 py-1.5"
        style={{ background: footerBg, borderTop: `1px solid ${headerSoft}` }}
      >
        <div className="mt-0.5 shrink-0">{footerIcon}</div>
        <div
          className="font-tamil text-[8.5px] font-semibold leading-tight"
          style={{ color: footerColor }}
        >
          {footerText}
        </div>
      </div>
    </div>
  );
}
