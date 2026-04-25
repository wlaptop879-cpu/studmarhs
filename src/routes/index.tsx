import { createFileRoute } from "@tanstack/react-router";
import { StudentManager } from "@/components/StudentManager";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Wisdom Maths Tuition Centre — Student Marks" },
      {
        name: "description",
        content:
          "Manage and export student marks as beautiful progress cards. Tamil & English supported.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen bg-canvas">
      <StudentManager />
      <Toaster richColors position="top-center" />
    </main>
  );
}
