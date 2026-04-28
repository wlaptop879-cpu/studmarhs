import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Wisdom Maths" }] }),
});

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) nav({ to: "/" });
  }, [session, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast.error("Enter email and password");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Wisdom Maths</h1>
          <p className="mt-1 text-xs text-ink-muted">
            {mode === "signin" ? "Sign in to manage your classes" : "Create a staff account"}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Email
            </label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 rounded-xl border-border bg-canvas"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Password
            </label>
            <Input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 rounded-xl border-border bg-canvas"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-ink text-surface hover:bg-ink/90"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-ink-muted hover:text-ink"
        >
          {mode === "signin"
            ? "New here? Create a staff account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
