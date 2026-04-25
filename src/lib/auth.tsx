import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isAuthed, signIn as doSignIn, signOut as doSignOut } from "@/lib/students";

type AuthCtx = {
  authed: boolean;
  hydrated: boolean;
  signIn: (u: string, p: string) => boolean;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAuthed(isAuthed());
    setHydrated(true);
  }, []);

  return (
    <Ctx.Provider
      value={{
        authed,
        hydrated,
        signIn: (u, p) => {
          const ok = doSignIn(u, p);
          if (ok) setAuthed(true);
          return ok;
        },
        signOut: () => {
          doSignOut();
          setAuthed(false);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
