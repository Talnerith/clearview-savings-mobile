import { Redirect, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { colors, space } from "@/lib/theme";

// Caregiver group: requires a session, and renders a persistent "caregiver
// mode" indicator above the stack (CLAUDE.md: "Clear 'You are in caregiver
// mode' indicator at all times").
export default function CaregiverLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.bannerSafe}>
        <Text style={styles.bannerText}>Caregiver mode</Text>
      </SafeAreaView>
      <View style={styles.body}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="patients" options={{ title: "Patients" }} />
          <Stack.Screen name="patient/[id]" options={{ title: "Patient" }} />
          <Stack.Screen
            name="diagnostics"
            options={{ title: "Backend diagnostics" }}
          />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.caregiverBanner },
  bannerSafe: { backgroundColor: colors.caregiverBanner },
  bannerText: {
    color: colors.textInverse,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingVertical: space.xs,
    textTransform: "uppercase",
  },
  body: { flex: 1, backgroundColor: colors.background },
});
