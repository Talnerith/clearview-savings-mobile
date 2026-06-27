import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { AccountManager } from "@/components/AccountManager";
import { CaregiverActions } from "@/components/CaregiverActions";
import { HeaderBack } from "@/components/HeaderBack";
import { PatientSettingsForm } from "@/components/PatientSettingsForm";
import { ScheduledDeposits } from "@/components/ScheduledDeposits";
import { Screen } from "@/components/Screen";
import { Button, Loading, Notice } from "@/components/ui";
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
    try {
      const [p, a] = await Promise.all([getPatient(id), listAccounts(id)]);
      setPatient(p);
      setAccounts(a);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load patient.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Always-available return to the patient list. Native already renders a
  // working back chevron (tap + swipe); only the web build needs a custom one
  // (the default chevron is absent on a direct URL / refresh). Overriding
  // headerLeft on native broke its back button.
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/(caregiver)/patients");
  }
  const screenOptions =
    Platform.OS === "web"
      ? { headerLeft: () => <HeaderBack onPress={goBack} /> }
      : {};

  if (!patient && !error) {
    return (
      <>
        <Stack.Screen options={screenOptions} />
        <Screen scroll={false}>
          <Loading label="Loading…" />
        </Screen>
      </>
    );
  }

  return (
    <Screen contentStyle={{ paddingBottom: space.xl }}>
      <Stack.Screen options={screenOptions} />
      {error ? <Notice>{error}</Notice> : null}

      {patient ? (
        <View style={styles.header}>
          <Text style={styles.name}>{patient.display_name}</Text>
        </View>
      ) : null}

      {accounts && accounts.length > 0 ? (
        <>
          <AccountManager
            patientId={id}
            accounts={accounts}
            settings={patient?.settings}
            onChanged={load}
          />
          <ScheduledDeposits
            patientId={id}
            accounts={accounts}
            settings={patient?.settings}
            onChanged={load}
          />
          <CaregiverActions patientId={id} accounts={accounts} onDone={load} />
        </>
      ) : (
        <Notice>This patient has no accounts yet.</Notice>
      )}

      {patient ? (
        <PatientSettingsForm patient={patient} onChanged={load} />
      ) : null}

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
  switchBlock: { gap: space.sm, marginTop: space.lg },
});
