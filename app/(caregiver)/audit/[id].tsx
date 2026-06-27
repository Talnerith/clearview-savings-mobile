import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { HeaderBack } from "@/components/HeaderBack";
import { Screen } from "@/components/Screen";
import { Card, Loading, Notice } from "@/components/ui";
import { formatCaregiverDate } from "@/lib/format";
import { listAuditLog, type AuditEntry } from "@/lib/queries";
import { colors, space } from "@/lib/theme";

function humanize(kind: string): string {
  const s = kind.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Caregiver audit log for one patient: every recorded action, most recent
// first. Read-only.
export default function AuditLog() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await listAuditLog(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the audit log.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/(caregiver)/patient/${id}`);
  }

  const options =
    Platform.OS === "web"
      ? { title: "Audit log", headerLeft: () => <HeaderBack onPress={goBack} /> }
      : { title: "Audit log" };

  return (
    <>
      <Stack.Screen options={options} />
      <Screen contentStyle={{ gap: space.sm }}>
        <Text style={styles.title}>Audit log</Text>
        {error ? <Notice>{error}</Notice> : null}
        {entries === null && !error ? <Loading /> : null}
        {entries && entries.length === 0 ? (
          <Text style={styles.muted}>No recorded actions yet.</Text>
        ) : null}
        {entries?.map((e) => (
          <Card key={e.id}>
            <View style={styles.row}>
              <Text style={styles.action}>{humanize(e.action_kind)}</Text>
              <Text style={styles.date}>{formatCaregiverDate(e.created_at)}</Text>
            </View>
            <Text style={styles.target}>{humanize(e.target_kind)}</Text>
            {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
          </Card>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
  },
  action: { fontSize: 16, fontWeight: "600", color: colors.text },
  date: { fontSize: 13, color: colors.textMuted },
  target: { fontSize: 13, color: colors.textMuted },
  note: { fontSize: 14, color: colors.text, marginTop: space.xs },
});
