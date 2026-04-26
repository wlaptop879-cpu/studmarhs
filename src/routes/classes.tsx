import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useClasses, useStudents, useExams } from "@/hooks/useStudents";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ClassRoom } from "@/lib/students";

export const Route = createFileRoute("/classes")({
  component: ClassesPage,
  head: () => ({ meta: [{ title: "Manage Classes — Wisdom Maths" }] }),
});

function ClassesPage() {
  const { classes, addClass, updateClass, deleteClass, hydrated } = useClasses();
  const { allStudents } = useStudents();
  const { allExams } = useExams();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDel, setConfirmDel] = useState<ClassRoom | null>(null);

  if (!hydrated) return null;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast.error("Enter class name");
    if (classes.some((c) => c.name.toLowerCase() === n.toLowerCase()))
      return toast.error("Class already exists");
    addClass(n);
    setName("");
    toast.success("Class created");
  }
  function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (!n) return toast.error("Name required");
    updateClass(editing.id, { name: n });
    setEditing(null);
    toast.success("Class renamed");
  }

  return (
    <AppShell back={{ to: "/" }}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Classes</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Create classes (e.g. 10, 11, 12). Open a class to add students and enter marks.
          </p>
        </div>

        <form
          onSubmit={add}
          className="rounded-3xl border border-border bg-surface p-5 shadow-soft"
        >
          <Label htmlFor="cn" className="text-xs font-medium text-ink-muted">
            New class name
          </Label>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <Input
              id="cn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Std 10"
              className="flex-1 rounded-xl border-border bg-canvas"
            />
            <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
              <Plus className="mr-1 h-4 w-4" /> Add class
            </Button>
          </div>
        </form>

        <div>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            All classes · {classes.length}
          </h2>
          {classes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-ink-muted">
              No classes yet. Add one above.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {classes.map((c) => {
                const isEditing = editing?.id === c.id;
                const studentCount = allStudents.filter((s) => s.classId === c.id).length;
                const examCount = allExams.filter((e) => e.classId === c.id).length;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mint to-sky text-sm font-bold">
                      {c.name.replace(/[^0-9A-Za-z]/g, "").slice(-2) || "·"}
                    </div>
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-lg border-border bg-canvas"
                      />
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">{c.name}</span>
                        <span className="text-[11px] text-ink-muted">
                          {studentCount} students · {examCount} exams
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
                            aria-label="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
                            aria-label="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditing(c);
                              setEditName(c.name);
                            }}
                            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDel(c)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this class?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDel?.name}</strong> and ALL its students &amp; exams will be
              permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDel) {
                  deleteClass(confirmDel.id);
                  toast.success("Class deleted");
                }
                setConfirmDel(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
