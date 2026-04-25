import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { isAuthed, initials, avatarTone } from "@/lib/students";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/students";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthed()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Students — Wisdom Maths" }] }),
});

const toneBg: Record<string, string> = {
  mint: "bg-mint",
  peach: "bg-peach",
  lilac: "bg-lilac",
  lemon: "bg-lemon",
  sky: "bg-sky",
  rose: "bg-rose",
};

function AdminPage() {
  const { students, addStudent, updateStudent, deleteStudent, hydrated } = useStudents();
  const [name, setName] = useState("");
  const [nameTamil, setNameTamil] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editTamil, setEditTamil] = useState("");
  const [confirmDel, setConfirmDel] = useState<Student | null>(null);

  if (!hydrated) return null;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return toast.error("Enter student name");
    if (students.some((s) => s.name.toLowerCase() === n.toLowerCase())) {
      return toast.error("Student already exists");
    }
    addStudent(n, nameTamil);
    setName("");
    setNameTamil("");
    toast.success("Student added");
  }

  function startEdit(s: Student) {
    setEditing(s);
    setEditName(s.name);
    setEditTamil(s.nameTamil ?? "");
  }
  function saveEdit() {
    if (!editing) return;
    const n = editName.trim();
    if (!n) return toast.error("Name required");
    updateStudent(editing.id, { name: n, nameTamil: editTamil.trim() || undefined });
    setEditing(null);
    toast.success("Updated");
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Students</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Add students once. Use Mark Entry to record exam marks.
          </p>
        </div>

        <form
          onSubmit={add}
          className="rounded-3xl border border-border bg-surface p-5 shadow-soft"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-xs font-medium text-ink-muted">
                Student name (English)
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Krishnan"
                className="mt-1 rounded-xl border-border bg-canvas"
              />
            </div>
            <div>
              <Label htmlFor="tn" className="text-xs font-medium text-ink-muted">
                Student name (Tamil)
              </Label>
              <Input
                id="tn"
                lang="ta"
                value={nameTamil}
                onChange={(e) => setNameTamil(e.target.value)}
                placeholder="மீரா கிருஷ்ணன்"
                className="font-tamil mt-1 rounded-xl border-border bg-canvas"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
              <Plus className="mr-1 h-4 w-4" /> Add student
            </Button>
          </div>
        </form>

        <div>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Roster · {students.length}
          </h2>
          {students.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-ink-muted">
              No students yet. Add your first student above.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {students.map((s) => {
                const isEditing = editing?.id === s.id;
                const tone = avatarTone(s.name);
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        toneBg[tone],
                      )}
                    >
                      {initials(s.name)}
                    </div>
                    {isEditing ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-lg border-border bg-canvas"
                        />
                        <Input
                          lang="ta"
                          value={editTamil}
                          onChange={(e) => setEditTamil(e.target.value)}
                          className="font-tamil rounded-lg border-border bg-canvas"
                          placeholder="தமிழ்"
                        />
                      </div>
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{s.name}</span>
                        {s.nameTamil && (
                          <span className="font-tamil truncate text-xs text-ink-muted">
                            {s.nameTamil}
                          </span>
                        )}
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
                            onClick={() => startEdit(s)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDel(s)}
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
            <AlertDialogTitle>Remove this student?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel?.name}
              {confirmDel?.nameTamil ? ` (${confirmDel.nameTamil})` : ""} will be removed from
              the roster. Existing exam marks for this student will remain in past exams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDel) {
                  deleteStudent(confirmDel.id);
                  toast.success("Removed");
                }
                setConfirmDel(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
