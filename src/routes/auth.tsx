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

// Fixed staff credentials (single shared login)
const STAFF_USERNAME = "WISDOM";
const STAFF_PASSWORD = "MATHS";
// Supabase requires an email under the hood; we map the username to a fixed synthetic email.
const STAFF_EMAIL = "wisdom@app.local";

async function ensureStaffAccount() {
  // Try sign-in; if it fails because the account doesn't exist yet, create it.
  const first = await supabase.auth.signInWithPassword({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
  });
  if (!first.error) return;

  const signup = await supabase.auth.signUp({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
  });
  if (signup.error) throw signup.error;

  // Some projects still require a follow-up sign-in after signup
  if (!signup.data.session) {
    const retry = await supabase.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    });
    if (retry.error) throw retry.error;
  }
}

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) nav({ to: "/" });
  }, [session, loading, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().toUpperCase() !== STAFF_USERNAME || password !== STAFF_PASSWORD) {
      toast.error("Incorrect username or password");
      return;
    }
    setBusy(true);
    try {
      await ensureStaffAccount();
      toast.success("Welcome!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
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
          <p className="mt-1 text-xs text-ink-muted">Sign in to manage your classes</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Username
            </label>
            <Input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 rounded-xl border-border bg-canvas"
              maxLength={32}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Password
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 rounded-xl border-border bg-canvas"
              maxLength={64}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-xl bg-ink text-surface hover:bg-ink/90"
          >
            {busy ? "Please wait…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
