import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { CLASS_NAME } from "@/lib/students";
import { LogOut, Users, ListChecks, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Mark Entry", icon: ListChecks },
  { to: "/admin", label: "Students", icon: Users },
  { to: "/export", label: "Export Image", icon: ImageIcon },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground">
              W
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Wisdom Maths Tuition Centre</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Class · {CLASS_NAME}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              nav({ to: "/login" });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-2 lg:px-8">
          {tabs.map((t) => {
            const active = loc.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-ink text-surface"
                    : "text-ink-muted hover:bg-canvas hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
