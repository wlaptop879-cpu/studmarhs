import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStudents, useAttendance } from "@/hooks/useStudents";
import {
  avatarTone,
  formatTime12,
  initials,
  isoToDateInput,
  nowTimeHHmm,
  type AttendanceRecord,
} from "@/lib/students";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Clock, CheckCheck, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$classId/attendance")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Attendance — Wisdom Maths" }] }),
});

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lilac: "bg-lilac",
  lemon: "bg-lemon",
  sky: "bg-sky",
  rose: "bg-rose",
};

function AttendancePage() {
  const { classId } = Route.useParams();
  const { students, hydrated: sh } = useStudents(classId);
  const [date, setDate] = useState<string>(isoToDateInput(new Date().toISOString()));
  const { day, hydrated: ah, setRecord, markAllPresent, clearAll } = useAttendance(classId, date);

  const counts = useMemo(() => {
    const recs = day?.records ?? {};
    let p = 0;
    let a = 0;
    for (const s of students) {
      const r = recs[s.id];
      if (r?.status === "present") p++;
      else if (r?.status === "absent") a++;
    }
    return { present: p, absent: a, pending: students.length - p - a };
  }, [students, day]);

  if (!sh || !ah) return null;

  function togglePresent(sid: string, current?: AttendanceRecord) {
    if (current?.status === "present") {
      void setRecord(sid, null);
    } else {
      void setRecord(sid, { status: "present", time: nowTimeHHmm() });
    }
  }
  function toggleAbsent(sid: string, current?: AttendanceRecord) {
    if (current?.status === "absent") {
      void setRecord(sid, null);
    } else {
      void setRecord(sid, { status: "absent" });
    }
  }
  function setTime(sid: string, time: string, current?: AttendanceRecord) {
    if (!current || current.status !== "present") return;
    void setRecord(sid, { status: "present", time });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tap <span className="font-semibold text-emerald-700">Present</span> — arrival time is
            stamped automatically. Edit time anytime.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr_auto_auto] sm:items-end">
          <div>
            <Label className="text-xs font-medium text-ink-muted">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="mt-1 rounded-xl border-border bg-canvas"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
              ✓ {counts.present} Present
            </span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">
              ✕ {counts.absent} Absent
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              ⋯ {counts.pending} Pending
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void markAllPresent(
                students.map((s) => s.id),
                nowTimeHHmm(),
              );
              toast.success("Pending students marked present");
            }}
            disabled={students.length === 0 || counts.pending === 0}
            className="rounded-xl"
          >
            <CheckCheck className="mr-1 h-4 w-4" /> All Present
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("Clear today's attendance?")) {
                void clearAll();
                toast.success("Cleared");
              }
            }}
            disabled={counts.present + counts.absent === 0}
            className="rounded-xl"
          >
            <Eraser className="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="font-tamil rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-ink-muted">
          இன்னும் மாணவர்கள் இல்லை. முதலில் Students-ல் சேர்க்கவும்.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => {
            const tone = avatarTone(s.name);
            const rec = day?.records?.[s.id];
            const status = rec?.status;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 shadow-soft transition-colors",
                  status === "present"
                    ? "border-emerald-300 bg-emerald-50/70"
                    : status === "absent"
                      ? "border-rose-300 bg-rose-50/70"
                      : "border-border bg-surface",
                )}
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
                  <span className="text-[11px] text-ink-muted">
                    {status === "present" ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Arrived {formatTime12(rec?.time)}
                      </span>
                    ) : status === "absent" ? (
                      <span className="font-tamil">வரவில்லை</span>
                    ) : (
                      "Not marked"
                    )}
                  </span>
                </div>

                {status === "present" && (
                  <Input
                    type="time"
                    value={rec?.time ?? ""}
                    onChange={(e) => setTime(s.id, e.target.value, rec)}
                    className="h-9 w-[110px] rounded-xl border-emerald-200 bg-white text-xs tabular-nums"
                  />
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePresent(s.id, rec)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                      status === "present"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border bg-canvas text-ink-muted hover:border-emerald-400 hover:text-emerald-700",
                    )}
                    aria-label="Present"
                    title="Present"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleAbsent(s.id, rec)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                      status === "absent"
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-border bg-canvas text-ink-muted hover:border-rose-400 hover:text-rose-700",
                    )}
                    aria-label="Absent"
                    title="Absent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
