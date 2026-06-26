import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// The mobile app talks to the SAME Supabase project as the clearview-savings
// web app. Same Auth users, same Postgres, same Row-Level Security policies.
// There is no separate mobile backend — RLS is what scopes every caregiver to
// only their own patients, exactly as it does on the web.
//
// We use the publishable (anon-tier) key only. The privileged secret/service
// key never ships in a mobile bundle. Anything that needs the service key
// (e.g. MFA recovery) stays server-side in the web app.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  // Fail loud and early — a missing key means the app would silently fail to
  // reach the shared backend. The Diagnostics screen surfaces this too.
  console.warn(
    "[clearview-savings] EXPO_PUBLIC_SUPABASE_URL / " +
      "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. Copy .env.example to " +
      ".env.local and fill them from the web app's values.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? "http://invalid.local",
  supabasePublishableKey ?? "missing-key",
  {
    auth: {
      // Persist the session so the caregiver stays signed in between launches.
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No URL-based session detection on native — there is no browser URL.
      detectSessionInUrl: false,
    },
  },
);

// Whether the env was wired up at all. Used by the Diagnostics screen and the
// sign-in screen to give a precise error instead of a generic network failure.
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabaseUrlForDisplay = supabaseUrl ?? "(not set)";
