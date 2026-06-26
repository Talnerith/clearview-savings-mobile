import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// Patient group. Still gated by the caregiver's session (patient view is
// entered from caregiver mode), but renders NO caregiver chrome — no "caregiver
// mode" banner, no admin controls. Looks and feels like a real bank.
//
// Patient UX rules enforced here and in the screens: large type, calm copy, one
// primary action per screen, no modals/toasts, no auto-logout, never a raw 404.
export default function PatientLayout() {
  const { authed, loading } = useAuth();
  if (loading) return null;
  if (!authed) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
