import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { isAuthed, CLASS_NAME } from "@/lib/students";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isAuthed()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in — Wisdom Maths Tuition Centre" }],
  }),
});

function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (signIn(user, pass)) {
      toast.success("Welcome");
      nav({ to: "/" });
    } else {
      toast.error("Invalid credentials");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-brand-foreground">
            W
          </div>
          <h1 className="text-xl font-semibold">Wisdom Maths Tuition Centre</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
            Class · {CLASS_NAME} · Admin sign in
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-border bg-surface p-6 shadow-soft"
        >
          <div className="mb-4">
            <Label htmlFor="user" className="text-xs font-medium text-ink-muted">
              Username
            </Label>
            <Input
              id="user"
              autoFocus
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="WISDOM"
              className="mt-1 rounded-xl border-border bg-canvas uppercase"
              autoComplete="username"
            />
          </div>
          <div className="mb-5">
            <Label htmlFor="pass" className="text-xs font-medium text-ink-muted">
              Password
            </Label>
            <Input
              id="pass"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••"
              className="mt-1 rounded-xl border-border bg-canvas"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full rounded-xl bg-ink text-surface hover:bg-ink/90">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-muted">
          Authorised access only · Wisdom Maths Tuition Centre
        </p>
      </div>
    </div>
  );
}
