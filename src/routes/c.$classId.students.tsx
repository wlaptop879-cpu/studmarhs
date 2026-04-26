import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { initials, avatarTone } from "@/lib/students";
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
import { Pencil, Trash2, Plus, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/students";

export const Route = createFileRoute("/c/$classId/students")({
  component: StudentsPage,
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

function StudentsPage() {
  const { classId } = Route.useParams();
  const { students, addStudent, updateStudent, deleteStudent, hydrated } = useStudents(classId);
  const [nameTamil, setNameTamil] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [editTamil, setEditTamil] = useState("");
  const [confirmDel, setConfirmDel] = useState<Student | null>(null);
  const [q, setQ] = useState("");

  if (!hydrated) return null;

  const filtered = students.filter((s) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return s.name.toLowerCase().includes(t);
  });

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = nameTamil.trim();
    if (!n) return toast.error("மாணவர் பெயரை உள்ளிடவும்");
    if (students.some((s) => s.name.toLowerCase() === n.toLowerCase()))
      return toast.error("இந்த மாணவர் ஏற்கனவே உள்ளார்");
    // Store Tamil as the primary `name` so all sorting/filtering works.
    addStudent(n);
    setNameTamil("");
    toast.success("சேர்க்கப்பட்டது");
  }

  function startEdit(s: Student) {
    setEditing(s);
    setEditTamil(s.name);
  }
  function saveEdit() {
    if (!editing) return;
    const n = editTamil.trim();
    if (!n) return toast.error("பெயர் தேவை");
    updateStudent(editing.id, { name: n, nameTamil: undefined });
    setEditing(null);
    toast.success("மாற்றப்பட்டது");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="mt-1 text-sm text-ink-muted">
          வகுப்பின் மாணவர்களை தமிழில் சேர்க்கவும். Mark Entry-ல் தேர்வு மதிப்பெண்களை
          பதிவிடவும்.
        </p>
      </div>

      <form onSubmit={add} className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
        <div>
          <Label htmlFor="tn" className="text-xs font-medium text-ink-muted">
            மாணவர் பெயர் (தமிழில்)
          </Label>
          <Input
            id="tn"
            lang="ta"
            autoFocus
            value={nameTamil}
            onChange={(e) => setNameTamil(e.target.value)}
            placeholder="மீரா கிருஷ்ணன்"
            className="font-tamil mt-1 rounded-xl border-border bg-canvas text-base"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" className="rounded-xl bg-ink text-surface hover:bg-ink/90">
            <Plus className="mr-1 h-4 w-4" /> சேர்க்கவும்
          </Button>
        </div>
      </form>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
            Roster · {students.length}
          </h2>
          {students.length > 0 && (
            <div className="relative w-full max-w-[200px]">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="தேடு"
                className="font-tamil h-8 rounded-full border-border bg-surface pl-7 text-xs"
              />
            </div>
          )}
        </div>

        {students.length === 0 ? (
          <div className="font-tamil rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center text-sm text-ink-muted">
            இன்னும் மாணவர்கள் இல்லை. மேலே சேர்க்கவும்.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((s) => {
              const isEditing = editing?.id === s.id;
              const tone = avatarTone(s.name);
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft"
                >
                  <div
                    className={cn(
                      "font-tamil flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      toneBg[tone],
                    )}
                  >
                    {s.name.trim().charAt(0) || initials(s.name)}
                  </div>
                  {isEditing ? (
                    <Input
                      lang="ta"
                      autoFocus
                      value={editTamil}
                      onChange={(e) => setEditTamil(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="font-tamil flex-1 rounded-lg border-border bg-canvas"
                      placeholder="தமிழ் பெயர்"
                    />
                  ) : (
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-tamil truncate text-sm font-medium">{s.name}</span>
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

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>இந்த மாணவரை நீக்கவா?</AlertDialogTitle>
            <AlertDialogDescription className="font-tamil">
              {confirmDel?.name} இந்த வகுப்பிலிருந்து நீக்கப்படுவார்.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDel) {
                  deleteStudent(confirmDel.id);
                  toast.success("நீக்கப்பட்டது");
                }
                setConfirmDel(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
