import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  Account,
  Patient,
  ScheduledDeposit,
  Transaction,
} from "@/lib/queries";

// Demo mode lets the app be explored end-to-end with no backend — used for the
// public web demo so a reviewer can click through every screen without
// credentials. It is an explicit, labeled fallback, not a second code path for
// real data: the same screens render this mock data through the same query
// functions (lib/queries.ts checks isDemoActive()).
//
// Rule: the word "demo" only ever appears on caregiver-side chrome. Patient
// screens render neutral account/transaction data exactly as in production, so
// the patient illusion is never broken (see CLAUDE.md branding rules).

const DEMO_FLAG_KEY = "clearview.demo-mode";

// Module-level mirror of the persisted flag so plain (non-React) query
// functions can read it synchronously. Kept in sync by the AuthProvider, which
// resolves it on launch before any gated screen can mount.
let demoActive = false;

export function isDemoActive(): boolean {
  return demoActive;
}

export function setDemoActive(value: boolean): void {
  demoActive = value;
}

export async function loadDemoFlag(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DEMO_FLAG_KEY);
  demoActive = raw === "1";
  return demoActive;
}

export async function persistDemoFlag(value: boolean): Promise<void> {
  demoActive = value;
  if (value) await AsyncStorage.setItem(DEMO_FLAG_KEY, "1");
  else await AsyncStorage.removeItem(DEMO_FLAG_KEY);
}

// ── Mock data ───────────────────────────────────────────────────────────────
// Deterministic, neutral, fake-money. Two patients with a realistic spread of
// accounts and recent activity. Dates are fixed strings so the demo is stable.

const PATIENTS: Patient[] = [
  {
    id: "demo-p1",
    display_name: "Eleanor Whitfield",
    settings: { font_size: "lg", locale: "en-US", currency: "USD" },
    created_at: "2026-01-04T00:00:00.000Z",
  },
  {
    id: "demo-p2",
    display_name: "Arthur Bennett",
    settings: { font_size: "xl", locale: "en-GB", currency: "GBP" },
    created_at: "2026-02-12T00:00:00.000Z",
  },
];

const ACCOUNTS: Record<string, Account[]> = {
  "demo-p1": [
    {
      id: "demo-a1",
      patient_id: "demo-p1",
      name: "Everyday Checking",
      type: "checking",
      balance_cents: 248375,
      created_at: "2026-01-04T00:00:00.000Z",
    },
    {
      id: "demo-a2",
      patient_id: "demo-p1",
      name: "Rainy Day Savings",
      type: "savings",
      balance_cents: 1340500,
      created_at: "2026-01-04T00:00:00.000Z",
    },
  ],
  "demo-p2": [
    {
      id: "demo-a3",
      patient_id: "demo-p2",
      name: "Current Account",
      type: "checking",
      balance_cents: 76210,
      created_at: "2026-02-12T00:00:00.000Z",
    },
  ],
};

const TRANSACTIONS: Record<string, Transaction[]> = {
  "demo-a1": [
    {
      id: "demo-t1",
      account_id: "demo-a1",
      kind: "deposit",
      amount_cents: 190000,
      label: "Social Security",
      posted_at: "2026-06-22T13:00:00.000Z",
      source: "scheduled",
    },
    {
      id: "demo-t2",
      account_id: "demo-a1",
      kind: "deposit",
      amount_cents: 5000,
      label: "Birthday from Aunt Susan",
      posted_at: "2026-06-18T16:30:00.000Z",
      source: "code",
    },
    {
      id: "demo-t3",
      account_id: "demo-a1",
      kind: "withdrawal",
      amount_cents: 4225,
      label: "Pharmacy",
      posted_at: "2026-06-15T11:10:00.000Z",
      source: "manual",
    },
  ],
  "demo-a2": [
    {
      id: "demo-t4",
      account_id: "demo-a2",
      kind: "deposit",
      amount_cents: 25000,
      label: "Monthly transfer",
      posted_at: "2026-06-01T09:00:00.000Z",
      source: "manual",
    },
  ],
  "demo-a3": [
    {
      id: "demo-t5",
      account_id: "demo-a3",
      kind: "deposit",
      amount_cents: 82000,
      label: "State Pension",
      posted_at: "2026-06-20T08:00:00.000Z",
      source: "scheduled",
    },
    {
      id: "demo-t6",
      account_id: "demo-a3",
      kind: "withdrawal",
      amount_cents: 1599,
      label: "Newspaper subscription",
      posted_at: "2026-06-19T07:45:00.000Z",
      source: "manual",
    },
  ],
};

const PENDING: ScheduledDeposit[] = [
  {
    id: "demo-s1",
    account_id: "demo-a1",
    label: "Social Security",
    amount_cents: 190000,
    frequency: "monthly",
    next_run_at: "2026-07-22",
    pending_days: 5,
    active: true,
  },
];

// Getters mirror the lib/queries.ts read signatures.
export const demoData = {
  listPatients: (): Patient[] => PATIENTS,
  getPatient: (id: string): Patient | null =>
    PATIENTS.find((p) => p.id === id) ?? null,
  listAccounts: (patientId: string): Account[] => ACCOUNTS[patientId] ?? [],
  getAccount: (accountId: string): Account | null =>
    Object.values(ACCOUNTS)
      .flat()
      .find((a) => a.id === accountId) ?? null,
  listTransactions: (accountId: string): Transaction[] =>
    TRANSACTIONS[accountId] ?? [],
  listPendingDeposits: (accountIds: string[]): ScheduledDeposit[] =>
    PENDING.filter((d) => accountIds.includes(d.account_id)),
  listScheduledDeposits: (accountIds: string[]): ScheduledDeposit[] =>
    PENDING.filter((d) => accountIds.includes(d.account_id)),
};
