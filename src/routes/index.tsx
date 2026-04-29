import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useClasses, useStudents, useExams } from "@/hooks/useStudents";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, ChevronRight, GraduationCap, Settings } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Wisdom Maths Tuition Centre — Classes" }],
  }),
});

const classGradients = [
  "from-mint to-sky",
  "from-peach to-rose",
  "from-lilac to-sky",
  "from-lemon to-mint",
  "from-rose to-lilac",
  "from-sky to-mint",
  "from-peach to-lemon",
  "from-lilac to-mint",
];

function HomePage() {
  const { classes, addClass, hydrated } = useClasses();
  const { allStudents } = useStudents();
  const { allExams } = useExams();
  const [name, setName] = useState("");

  if (!hydrated) return null;

  function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast.error("Enter class name");
    if (classes.some((c) => c.name.toLowerCase() === n.toLowerCase()))
      return toast.error("Class already exists");
    addClass(n);
    setName("");
    toast.success(`Class "${n}" created`);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-brand/70 p-6 text-brand-foreground shadow-card sm:p-10">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] opacity-80">
            <GraduationCap className="h-3.5 w-3.5" /> Wisdom Maths
          </div>
          <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Pick a class to enter marks &amp; export beautiful results.
          </h1>
          <p className="mt-3 max-w-lg text-sm opacity-80">
            Create classes like <span className="font-semibold">10, 11, 12</span>. Each class has
            its own students, mark entries and PNG / PDF exports — all securely
            saved to the cloud and accessible from any device.
          </p>
        </div>

        {/* Quick add */}
        <form
          onSubmit={quickAdd}
          className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5 shadow-soft sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Add a new class
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Std 12, Class 10, Batch A"
              className="mt-1 rounded-xl border-border bg-canvas"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
            <Plus className="mr-1 h-4 w-4" /> Create class
          </Button>
        </form>

        {/* Class grid */}
        <section>
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Your classes · {classes.length}
            </h2>
            {classes.length > 0 && (
              <Link
                to="/classes"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
              >
                <Settings className="h-3 w-3" /> Manage
              </Link>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-ink">No classes yet</p>
              <p className="mt-1 text-xs text-ink-muted">
                Create your first class above to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c, i) => {
                const studentCount = allStudents.filter((s) => s.classId === c.id).length;
                const examCount = allExams.filter((e) => e.classId === c.id).length;
                const gradient = classGradients[i % classGradients.length];
                return (
                  <Link
                    key={c.id}
                    to="/c/$classId/students"
                    params={{ classId: c.id }}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div
                      className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-70 blur-2xl`}
                    />
                    <div className="relative">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                        Class
                      </div>
                      <div className="mt-1 text-2xl font-bold tracking-tight">{c.name}</div>
                      <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-muted">
                        <span className="rounded-full bg-canvas px-2 py-0.5">
                          {studentCount} students
                        </span>
                        <span className="rounded-full bg-canvas px-2 py-0.5">
                          {examCount} exams
                        </span>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink group-hover:gap-2 transition-all">
                        Open <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
