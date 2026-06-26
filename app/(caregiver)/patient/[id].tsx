import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card, Loading, Notice } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import {
  getPatient,
  listAccounts,
  type Account,
  type Patient,
} from "@/lib/queries";
import { colors, space } from "@/lib/theme";

// Caregiver view of one patient: their accounts and balances, plus the one-tap
// switch into patient view (with an inline confirmation, per CLAUDE.md).
export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, a] = await Promise.all([getPatient(id), listAccounts(id)]);
      setPatient(p);
      setAccounts(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load patient.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!patient && !error) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingBottom: space.xl }}>
      {error ? <Notice>{error}</Notice> : null}

      {patient ? (
        <View style={styles.header}>
          <Text style={styles.name}>{patient.display_name}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Accounts</Text>
      {accounts?.length === 0 ? (
        <Notice>This patient has no accounts yet.</Notice>
      ) : null}
      {accounts?.map((a) => (
        <Card key={a.id}>
          <Text style={styles.accountName}>{a.name}</Text>
          <Text style={styles.accountType}>
            {a.type === "checking" ? "Checking" : "Savings"}
          </Text>
          <Text style={styles.balance}>
            {formatMoney(a.balance_cents, patient?.settings)}
          </Text>
        </Card>
      ))}

      <View style={styles.switchBlock}>
        {confirmSwitch ? (
          <>
            <Notice>
              Open this patient&apos;s view? Hand the device to{" "}
              {patient?.display_name ?? "the patient"} after switching.
            </Notice>
            <Button
              label="Open patient view"
              onPress={() => router.push(`/(patient)/view/${id}/accounts`)}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setConfirmSwitch(false)}
            />
          </>
        ) : (
          <Button
            label="Switch to patient view"
            variant="secondary"
            onPress={() => setConfirmSwitch(true)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space.sm },
  name: { fontSize: 24, fontWeight: "700", color: colors.text },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountName: { fontSize: 18, fontWeight: "600", color: colors.text },
  accountType: { fontSize: 13, color: colors.textMuted },
  balance: { fontSize: 26, fontWeight: "700", color: colors.text },
  switchBlock: { gap: space.sm, marginTop: space.lg },
});
