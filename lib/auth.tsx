import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  loadDemoFlag,
  persistDemoFlag,
  setDemoActive,
} from "@/lib/demo";
import { supabase } from "@/lib/supabase";

type AuthState = {
  // undefined = still resolving on launch; null = signed out; Session = signed in.
  session: Session | null | undefined;
  // Demo mode (mock data, no backend) — see lib/demo.ts. undefined until resolved.
  demo: boolean | undefined;
  loading: boolean;
  // True when the user may enter the app: a real session OR demo mode.
  authed: boolean;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  enterDemo: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [demo, setDemo] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Resolve any persisted session on launch (no idle timeout — matches the
    // web app's "no auto-logout, no session expiry warnings" rule).
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // Resolve the persisted demo flag before any gated screen can mount, so the
    // module-level mirror in lib/demo.ts is correct for plain query functions.
    loadDemoFlag().then(setDemo);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loading = session === undefined || demo === undefined;
  const authed = Boolean(session) || demo === true;

  const value = useMemo<AuthState>(
    () => ({
      session,
      demo,
      loading,
      authed,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { error: error?.message ?? null };
      },
      async enterDemo() {
        // Set the synchronous mirror first so queries are correct immediately,
        // then persist and update React state.
        setDemoActive(true);
        await persistDemoFlag(true);
        setDemo(true);
      },
      async signOut() {
        await supabase.auth.signOut();
        setDemoActive(false);
        await persistDemoFlag(false);
        setDemo(false);
      },
    }),
    [session, demo, loading, authed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
