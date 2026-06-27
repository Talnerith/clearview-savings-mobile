import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { LegalLinks } from "@/components/LegalLinks";
import { Screen } from "@/components/Screen";
import { Button, Card, Loading, Notice, TextField } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isDemoActive } from "@/lib/demo";
import { listPatients, type Patient } from "@/lib/queries";
import { colors, space } from "@/lib/theme";

// Caregiver home: the list of patients this caregiver owns (RLS-scoped).
export default function Patients() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listPatients();
      setPatients(rows);
      setError(null);
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

  async function onAddPatient() {
    setAddError(null);
    if (!newName.trim()) {
      setAddError("Enter the patient's name.");
      return;
    }
    if (isDemoActive()) {
      setAddError("Demo mode — changes aren’t saved.");
      return;
    }
    setAddBusy(true);
    try {
      await api.addPatient(newName.trim());
      setNewName("");
      await load();
    } catch (e) {
      setAddError(
        e instanceof ApiError ? e.message : "Could not add the patient.",
      );
    } finally {
      setAddBusy(false);
    }
  }

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
      <Brandmark size="sm" />

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

      <View style={styles.addBlock}>
        <Text style={styles.addTitle}>Add a patient</Text>
        <Text style={styles.addHint}>
          Use the name they’ll see at the top of their accounts.
        </Text>
        <TextField
          label="Patient name"
          value={newName}
          onChangeText={setNewName}
          placeholder="e.g. Margaret Smith"
          maxLength={80}
        />
        {addError ? <Notice>{addError}</Notice> : null}
        <Button label="Add patient" onPress={onAddPatient} loading={addBusy} />
      </View>

      <View style={styles.footerActions}>
        <Button
          label="Refresh"
          variant="secondary"
          onPress={onRefresh}
          loading={refreshing}
        />
      </View>

      <LegalLinks />
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
  addBlock: {
    gap: space.sm,
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  addHint: { fontSize: 14, color: colors.textMuted },
  footerActions: { gap: space.sm, marginTop: space.md },
});
