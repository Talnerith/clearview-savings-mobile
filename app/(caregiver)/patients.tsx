import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card, Loading, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { listPatients, type Patient } from "@/lib/queries";
import { colors, space } from "@/lib/theme";

// Caregiver home: the list of patients this caregiver owns (RLS-scoped).
export default function Patients() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPatients(await listPatients());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load patients.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (patients === null && !error) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading patients…" />
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={{ paddingBottom: space.xl }}
      // RefreshControl needs to live on the ScrollView; Screen forwards children
      // only, so we re-create a simple refreshable layout here via the list.
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>Your patients</Text>
        <Link href="/(caregiver)/diagnostics" style={styles.diagLink}>
          Diagnostics
        </Link>
      </View>

      {error ? <Notice>{error}</Notice> : null}

      {patients && patients.length === 0 ? (
        <Notice>
          No patients yet. Add a patient in the web caregiver dashboard; they
          will appear here automatically.
        </Notice>
      ) : null}

      {patients?.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => router.push(`/(caregiver)/patient/${p.id}`)}
        >
          <Card>
            <Text style={styles.name}>{p.display_name}</Text>
            <Text style={styles.meta}>
              {p.settings?.locale ?? "en-US"} ·{" "}
              {p.settings?.currency ?? "USD"}
            </Text>
          </Card>
        </Pressable>
      ))}

      <View style={styles.footerActions}>
        <Button
          label="Refresh"
          variant="secondary"
          onPress={onRefresh}
          loading={refreshing}
        />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  diagLink: { color: colors.primary, fontWeight: "600" },
  name: { fontSize: 18, fontWeight: "600", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  footerActions: { gap: space.sm, marginTop: space.md },
});
