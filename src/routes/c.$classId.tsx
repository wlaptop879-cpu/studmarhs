import { createFileRoute, Outlet, Link, useLocation, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useClasses } from "@/hooks/useStudents";
import { Users, ListChecks, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$classId")({
  beforeLoad: ({ params, location }) => {
    // Redirect bare /c/$classId to students subpage
    if (location.pathname.match(/^\/c\/[^/]+\/?$/)) {
      throw redirect({ to: "/c/$classId/students", params });
    }
  },
  component: ClassLayout,
});

function ClassLayout() {
  const { classId } = Route.useParams();
  const { classes, hydrated } = useClasses();
  const loc = useLocation();
  const cls = classes.find((c) => c.id === classId);

  if (!hydrated) return null;
  if (!cls) return null;

  const tabs = [
    { to: "/c/$classId/students", label: "Students", icon: Users },
    { to: "/c/$classId/marks", label: "Marks", icon: ListChecks },
    { to: "/c/$classId/export", label: "Export", icon: ImageIcon },
  ] as const;

  return (
    <AppShell back={{ to: "/" }} classBadge={`Class · ${cls.name}`}>
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-surface p-1 shadow-soft">
        {tabs.map((t) => {
          const active = loc.pathname.startsWith(t.to.replace("$classId", classId));
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              params={{ classId }}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                active
                  ? "bg-ink text-surface shadow-sm"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </AppShell>
  );
}
