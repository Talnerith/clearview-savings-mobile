import { supabase } from "@/lib/supabase";

// Typed client for the mobile write API (the web app's app/api/m/* endpoints).
// Reads go straight to Supabase under RLS (lib/queries.ts); writes go here,
// because the balance-affecting logic lives once in the web app and we call it
// with the caregiver's access token rather than re-implementing it. The server
// re-validates input, enforces MFA/AAL, and checks patient ownership — a
// crafted id is rejected there, never trusted from the client.

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// A client-facing API failure. `code` is the stable machine code the server
// returns (e.g. "mfa_required", "invalid_or_used", "invalid_account"); message
// is calm and safe to show.
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      "no_api_base",
      "This app isn't configured to reach the server yet.",
      0,
    );
  }

  let token = await freshAccessToken(false);
  if (!token) {
    throw new ApiError("unauthenticated", "Please sign in again.", 401);
  }

  let res = await doFetch(path, body, token);

  // The token may have gone stale between getSession() and the request (mobile
  // backgrounds the auto-refresh timer). On a 401, force a refresh and retry
  // once before surfacing "session expired" to the user.
  if (res.status === 401) {
    token = await freshAccessToken(true);
    if (token) res = await doFetch(path, body, token);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (shouldn't happen for our endpoints) — leave json null.
  }
  const payload = (json ?? {}) as { error?: string; code?: string };

  if (!res.ok) {
    throw new ApiError(
      payload.code ?? "error",
      payload.error ?? "Something went wrong.",
      res.status,
    );
  }
  return json as T;
}

// Returns a valid access token, refreshing if it's expired/near-expiry (or when
// forced). getSession() alone can hand back a stale token because supabase-js
// only auto-refreshes on a timer that mobile pauses in the background — that was
// the "Your session has expired" on writes while reads (which refresh on their
// own request path) kept working.
async function freshAccessToken(force: boolean): Promise<string | null> {
  if (force) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at <= nowSec + 30) {
    const { data } = await supabase.auth.refreshSession();
    return data.session?.access_token ?? session.access_token;
  }
  return session.access_token;
}

async function doFetch(
  path: string,
  body: unknown,
  token: string,
): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "network",
      "Couldn't reach the server. Check your connection and try again.",
      0,
    );
  }
}

export type RedeemResult = {
  ok: true;
  transactionId: string;
  accountId: string;
  amountCents: number;
  label: string;
};

export type ManualTxnResult = {
  ok: true;
  transactionId: string;
  accountId: string;
  amountCents: number;
  label: string;
};

export type TransferResult = {
  ok: true;
  transferId: string;
  fromTransactionId: string;
  toTransactionId: string;
};

export type ManualTxnInput = {
  patientId: string;
  accountId: string;
  kind: "deposit" | "withdrawal" | "fee" | "adjustment";
  amount: string; // dollars string, e.g. "12.34"
  label: string;
  direction?: "increase" | "decrease";
};

export type TransferInput = {
  patientId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
};

export const api = {
  redeemDeposit: (patientId: string, code: string) =>
    postJson<RedeemResult>("/api/m/deposit/redeem", { patientId, code }),
  manualTransaction: (input: ManualTxnInput) =>
    postJson<ManualTxnResult>("/api/m/transactions/manual", input),
  transfer: (input: TransferInput) =>
    postJson<TransferResult>("/api/m/transfers", input),
};
