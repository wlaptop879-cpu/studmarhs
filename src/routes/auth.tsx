import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Mail, Lock, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Wisdom Maths" }] }),
});

// Legacy shared staff login (kept for backward compatibility)
const STAFF_USERNAME = "WISDOM";
const STAFF_PASSWORD = "MATHS";
const STAFF_EMAIL = "wisdom@app.local";

async function ensureStaffAccount() {
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
  if (!signup.data.session) {
    const retry = await supabase.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    });
    if (retry.error) throw retry.error;
  }
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(72),
});

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) nav({ to: "/" });
  }, [session, loading, nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Wisdom Maths</h1>
          <p className="mt-1 text-xs text-ink-muted">
            Sign in or create an account to continue
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignUpForm />
          </TabsContent>
          <TabsContent value="forgot" className="mt-4">
            <ForgotForm />
          </TabsContent>
        </Tabs>

        <div className="mt-6 border-t border-border pt-4">
          <StaffQuickLogin />
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          {icon}
        </div>
      )}
      <Input
        {...props}
        className={`rounded-xl border-border bg-canvas ${icon ? "pl-9" : ""} ${props.className ?? ""}`}
      />
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      if (/confirm|verif/i.test(error.message)) {
        toast.error("Please verify your email before signing in.");
      } else {
        toast.error(error.message || "Invalid credentials");
      }
      return;
    }
    toast.success("Welcome back!");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Field
        icon={<Mail className="h-4 w-4" />}
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        icon={<Lock className="h-4 w-4" />}
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-xl bg-ink text-surface hover:bg-ink/90"
      >
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name: parsed.data.name },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Verification email sent. Please check your inbox.");
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-canvas p-4 text-center text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-ink-muted">
          We sent a verification link to <strong>{email}</strong>. Click it to
          activate your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Field
        icon={<UserIcon className="h-4 w-4" />}
        placeholder="Full name"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <Field
        icon={<Mail className="h-4 w-4" />}
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        icon={<Lock className="h-4 w-4" />}
        type="password"
        placeholder="Password (8+ chars, mixed case, number)"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-xl bg-ink text-surface hover:bg-ink/90"
      >
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Password reset email sent.");
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-canvas p-4 text-center text-sm">
        <p className="font-medium">Email sent</p>
        <p className="mt-1 text-ink-muted">
          If an account exists for <strong>{email}</strong>, a reset link is on
          its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        Enter your email and we'll send you a reset link.
      </p>
      <Field
        icon={<Mail className="h-4 w-4" />}
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        type="submit"
        disabled={busy}
        className="mt-1 rounded-xl bg-ink text-surface hover:bg-ink/90"
      >
        {busy ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

function StaffQuickLogin() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      username.trim().toUpperCase() !== STAFF_USERNAME ||
      password !== STAFF_PASSWORD
    ) {
      toast.error("Incorrect username or password");
      return;
    }
    setBusy(true);
    try {
      await ensureStaffAccount();
      toast.success("Welcome!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-xs text-ink-muted underline-offset-4 hover:underline"
      >
        Use staff shared login
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Staff login
      </p>
      <Field
        placeholder="Username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={32}
      />
      <Field
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        maxLength={64}
      />
      <Button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-ink text-surface hover:bg-ink/90"
      >
        {busy ? "Please wait…" : "Sign in as staff"}
      </Button>
    </form>
  );
}
