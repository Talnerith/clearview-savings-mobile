import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";

// Auth group: if already signed in, bounce to the caregiver home.
export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (!loading && session) return <Redirect href="/(caregiver)/patients" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
