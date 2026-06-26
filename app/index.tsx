import { Redirect } from "expo-router";

import { Loading } from "@/components/ui";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";

// Entry redirect: resolve the persisted session, then send the caregiver to
// their patient list (caregiver mode is the app's home — patient view is
// entered from there, mirroring the web "switch to patient view" flow).
export default function Index() {
  const { authed, loading } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!authed) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(caregiver)/patients" />;
}
