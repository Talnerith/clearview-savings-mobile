import { Redirect, Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth";
import { colors, space } from "@/lib/theme";

// Caregiver group: requires a session, and renders a persistent top bar with
// "caregiver mode" + Settings + Sign out above the stack (CLAUDE.md: clear
// caregiver-mode indicator + always-available account controls). The top bar is
// in the layout tree (not the native header) so its buttons fire reliably on
// native — header-rendered Pressables don't.
export default function CaregiverLayout() {
  const router = useRouter();
  const { authed, demo, needsMfa, loading, signOut } = useAuth();
  if (loading) return null;
  if (needsMfa) return <Redirect href="/(auth)/challenge" />;
  if (!authed) return <Redirect href="/(auth)/sign-in" />;

  async function onSignOut() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.bannerSafe}>
        <View style={styles.topBar}>
          <Text style={styles.bannerText}>
            Caregiver mode{demo ? " · Demo data" : ""}
          </Text>
          <View style={styles.topActions}>
            <Pressable
              onPress={() => router.push("/(caregiver)/settings")}
              hitSlop={8}
            >
              <Text style={styles.topLink}>Settings</Text>
            </Pressable>
            <Pressable onPress={onSignOut} hitSlop={8}>
              <Text style={styles.topLink}>{demo ? "Exit demo" : "Sign out"}</Text>
            </Pressable>
          </View>
        </View>
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
          <Stack.Screen name="audit/[id]" options={{ title: "Audit log" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  bannerText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  topActions: { flexDirection: "row", gap: space.md },
  topLink: { color: colors.textInverse, fontSize: 14, fontWeight: "700" },
  body: { flex: 1, backgroundColor: colors.background },
});
