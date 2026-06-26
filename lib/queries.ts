import { supabase } from "@/lib/supabase";
import type { PatientSettings } from "@/lib/format";

// Data access for the mobile app. Every read goes through PostgREST against the
// shared Supabase project, so the SAME Row-Level Security policies that protect
// the web app scope these queries to the signed-in caregiver's own patients.
// We never trust an id from the client without RLS enforcing ownership — a
// crafted patientId simply returns zero rows.
//
// Column names are the Postgres snake_case names from the web app's Drizzle
// schema (lib/db/schema.ts), since PostgREST exposes the raw table columns.

export type Patient = {
  id: string;
  display_name: string;
  settings: PatientSettings;
  created_at: string;
};

export type Account = {
  id: string;
  patient_id: string;
  name: string;
  type: "checking" | "savings";
  balance_cents: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  kind: "deposit" | "withdrawal" | "fee" | "adjustment";
  amount_cents: number;
  label: string;
  posted_at: string;
  source: "scheduled" | "code" | "manual" | "computed_balance";
};

export type ScheduledDeposit = {
  id: string;
  account_id: string;
  label: string;
  amount_cents: number;
  frequency: "weekly" | "biweekly" | "monthly";
  next_run_at: string;
  pending_days: number;
  active: boolean;
};

export async function listPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("id, display_name, settings, created_at")
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Patient[];
}

export async function getPatient(patientId: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("id, display_name, settings, created_at")
    .eq("id", patientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Patient) ?? null;
}

export async function listAccounts(patientId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, patient_id, name, type, balance_cents, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

export async function getAccount(accountId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, patient_id, name, type, balance_cents, created_at")
    .eq("id", accountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Account) ?? null;
}

export async function listTransactions(
  accountId: string,
  limit = 50,
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, account_id, kind, amount_cents, label, posted_at, source")
    .eq("account_id", accountId)
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

// Scheduled deposits whose next_run_at falls within pending_days of now show on
// the patient home as "Direct Deposit Pending" (read-only on mobile; the web
// app owns materialization). We surface the soonest upcoming one per patient.
export async function listPendingDeposits(
  accountIds: string[],
): Promise<ScheduledDeposit[]> {
  if (accountIds.length === 0) return [];
  const { data, error } = await supabase
    .from("scheduled_deposits")
    .select(
      "id, account_id, label, amount_cents, frequency, next_run_at, pending_days, active",
    )
    .in("account_id", accountIds)
    .eq("active", true);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ScheduledDeposit[];
  const now = Date.now();
  return rows.filter((d) => {
    const runAt = new Date(d.next_run_at).getTime();
    const windowOpensAt = runAt - d.pending_days * 24 * 60 * 60 * 1000;
    return now >= windowOpensAt && now <= runAt;
  });
}

// A lightweight connectivity probe used by the Diagnostics screen. Returns the
// round-trip latency and whether the authenticated read succeeded under RLS.
export async function pingBackend(): Promise<{
  ok: boolean;
  ms: number;
  patientCount: number;
  error: string | null;
}> {
  const started = Date.now();
  const { count, error } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true });
  return {
    ok: !error,
    ms: Date.now() - started,
    patientCount: count ?? 0,
    error: error?.message ?? null,
  };
}
