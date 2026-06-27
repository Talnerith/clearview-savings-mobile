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

// Where the session sits relative to MFA, mirroring the web app's AalState:
//  - "no-factor"       — no verified factor; AAL1 is full access.
//  - "aal1-needs-aal2" — a verified factor exists but the session is still
//                        AAL1; the caregiver must complete the TOTP challenge.
//  - "aal2"            — stepped up; full access.
export type AalState = "no-factor" | "aal1-needs-aal2" | "aal2";

type SignInResult = { error: string | null; mfaRequired: boolean };

type AuthState = {
  // undefined = still resolving on launch; null = signed out; Session = signed in.
  session: Session | null | undefined;
  // Demo mode (mock data, no backend) — see lib/demo.ts. undefined until resolved.
  demo: boolean | undefined;
  // MFA assurance of the current session. undefined while resolving.
  aal: AalState | undefined;
  loading: boolean;
  // True when the user may enter the app: demo, or a real session that does not
  // still owe an MFA step-up.
  authed: boolean;
  // A real session that owes an MFA step-up (route to the challenge screen).
  needsMfa: boolean;
  signInWithPassword: (
    email: string,
    password: string,
    captchaToken?: string,
  ) => Promise<SignInResult>;
  verifyTotp: (code: string) => Promise<{ error: string | null }>;
  enterDemo: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// Local computation off the session JWT (no network round-trip).
async function resolveAal(): Promise<AalState> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const currentLevel = data?.currentLevel ?? null;
  const nextLevel = data?.nextLevel ?? null;
  if (currentLevel === "aal2") return "aal2";
  if (currentLevel === "aal1" && nextLevel === "aal2") return "aal1-needs-aal2";
  return "no-factor";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [demo, setDemo] = useState<boolean | undefined>(undefined);
  const [aal, setAal] = useState<AalState | undefined>(undefined);

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

  // Recompute the MFA assurance level whenever the session changes. A null
  // session needs no step-up, so it resolves immediately to "no-factor".
  useEffect(() => {
    let cancelled = false;
    if (session === undefined) {
      setAal(undefined);
      return;
    }
    if (session === null) {
      setAal("no-factor");
      return;
    }
    setAal(undefined);
    resolveAal().then((next) => {
      if (!cancelled) setAal(next);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // A real session whose MFA level is still resolving must not flash the
  // caregiver area before the gate decides — treat it as still loading.
  const resolvingAal = Boolean(session) && aal === undefined;
  const loading = session === undefined || demo === undefined || resolvingAal;
  const needsMfa = Boolean(session) && aal === "aal1-needs-aal2";
  const authed = demo === true || (Boolean(session) && !needsMfa);

  const value = useMemo<AuthState>(
    () => ({
      session,
      demo,
      aal,
      loading,
      authed,
      needsMfa,
      async signInWithPassword(email, password, captchaToken) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
          options: captchaToken ? { captchaToken } : undefined,
        });
        if (error) return { error: error.message, mfaRequired: false };
        // The client now holds the session; compute whether a step-up is owed
        // so the caller can route to the challenge instead of the dashboard.
        const next = await resolveAal();
        setSession(data.session);
        setAal(next);
        return { error: null, mfaRequired: next === "aal1-needs-aal2" };
      },
      async verifyTotp(code) {
        const { data: factors, error: listErr } =
          await supabase.auth.mfa.listFactors();
        if (listErr) return { error: listErr.message };
        const totp =
          factors?.totp?.find((f) => f.status === "verified") ??
          factors?.totp?.[0];
        if (!totp) {
          return { error: "No authenticator app is set up for this account." };
        }
        const { data: challenge, error: challengeErr } =
          await supabase.auth.mfa.challenge({ factorId: totp.id });
        if (challengeErr) return { error: challengeErr.message };
        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: totp.id,
          challengeId: challenge.id,
          code: code.trim(),
        });
        if (verifyErr) return { error: verifyErr.message };
        // Session is upgraded to AAL2; refresh our derived state.
        const { data: sess } = await supabase.auth.getSession();
        setSession(sess.session);
        setAal(await resolveAal());
        return { error: null };
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
    [session, demo, aal, loading, authed, needsMfa],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
