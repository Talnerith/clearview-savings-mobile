import { useState } from "react";

import { ApiError } from "@/lib/api";
import { isDemoActive } from "@/lib/demo";

// Shared submit state for caregiver write forms: tracks busy/error, blocks in
// demo mode with a calm notice, and maps ApiError messages. `run` returns true
// on success so callers can reset/close. Keeps every form's boilerplate in one
// place (mirrors the web Server Action -> calm error pattern).
export function useWrite() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>): Promise<boolean> {
    setError(null);
    if (isDemoActive()) {
      setError("Demo mode — changes aren’t saved.");
      return false;
    }
    setBusy(true);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
