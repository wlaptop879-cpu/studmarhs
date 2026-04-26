import { Link, useNavigate } from "@tanstack/react-router";
import { CENTRE_NAME } from "@/lib/students";
import { Settings, ArrowLeft, Sparkles } from "lucide-react";

export function AppShell({
  children,
  back,
  classBadge,
}: {
  children: React.ReactNode;
  back?: { to: string; label?: string };
  classBadge?: string;
}) {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            {back ? (
              <button
                onClick={() => nav({ to: back.to })}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-canvas text-ink-muted hover:text-ink"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-brand-foreground"
              >
                <Sparkles className="h-4 w-4" />
              </Link>
            )}
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">{CENTRE_NAME}</div>
              {classBadge ? (
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  {classBadge}
                </div>
              ) : (
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  Class results · made simple
                </div>
              )}
            </div>
          </div>
          <Link
            to="/classes"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <Settings className="h-3.5 w-3.5" /> Classes
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-10">{children}</main>
    </div>
  );
}
