import { forwardRef } from "react";
import { gradeBand, type Student } from "@/lib/students";
import { cn } from "@/lib/utils";

type Props = {
  student: Student;
  centreName?: string;
};

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  lemon: "bg-lemon",
  peach: "bg-peach",
  rose: "bg-rose",
};

export const ProgressCard = forwardRef<HTMLDivElement, Props>(function ProgressCard(
  { student, centreName = "Wisdom Maths Tuition Centre" },
  ref,
) {
  const pct = Math.round((student.marks / student.maxMarks) * 100);
  const band = gradeBand(pct);
  const date = new Date(student.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-3xl bg-surface p-8 shadow-card"
      style={{ aspectRatio: "4 / 5" }}
    >
      {/* decorative corners */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lemon opacity-70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-mint opacity-60 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-peach opacity-60 blur-2xl" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {centreName}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">{student.subject}</h3>
          <p className="mt-1 text-xs text-ink-muted">Progress Report</p>
        </div>

        {/* Body */}
        <div className="my-auto flex flex-col items-center gap-5 py-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="text-2xl font-semibold leading-tight">{student.name}</div>
            {student.nameTamil && (
              <div className="font-tamil text-lg text-ink-muted leading-tight">
                {student.nameTamil}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-semibold tracking-tighter tabular-nums">
              {student.marks}
            </span>
            <span className="text-2xl font-light text-ink-muted tabular-nums">
              / {student.maxMarks}
            </span>
          </div>

          <div className={cn("rounded-full px-4 py-1.5 text-xs font-semibold", toneBg[band.tone])}>
            {band.label} · {pct}%
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between border-t border-border pt-5">
          <div className="flex flex-col">
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-muted">
              Date
            </span>
            <span className="mt-0.5 text-sm font-medium tabular-nums">{date}</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-xs font-bold text-brand">
            W
          </div>
        </div>
      </div>
    </div>
  );
});
