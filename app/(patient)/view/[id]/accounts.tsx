import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { Screen } from "@/components/Screen";
import { Loading } from "@/components/ui";
import { BRAND_NAME } from "@/lib/branding";
import { formatMoney, type PatientSettings } from "@/lib/format";
import {
  getPatient,
  listAccounts,
  listPendingDeposits,
  type Account,
  type ScheduledDeposit,
} from "@/lib/queries";
import { colors, patientType, radius, space } from "@/lib/theme";

// Patient home — "Your Accounts". Calm, large type, real-bank vocabulary.
// Never shows an error screen: on any failure it falls back to a calm message.
export default function PatientAccounts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [settings, setSettings] = useState<PatientSettings | undefined>();
  const [pending, setPending] = useState<ScheduledDeposit[]>([]);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [patient, accts] = await Promise.all([
        getPatient(id),
        listAccounts(id),
      ]);
      const pendingRows = await listPendingDeposits(accts.map((a) => a.id));
      setSettings(patient?.settings);
      setAccounts(accts);
      setPending(pendingRows);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (accounts === null && !failed) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          // Browser/tab-equivalent title is patient-visible — must read like a
          // real bank, never "demo"/"simulation".
          title: `${BRAND_NAME} — Your Accounts`,
          // The nav bar shows the brand logo lockup (mark + wordmark).
          headerTitle: () => <Brandmark size="sm" />,
        }}
      />
      <Screen contentStyle={{ gap: space.lg }}>
        <Text style={styles.greeting}>Your Accounts</Text>

        {failed ? (
          <Text style={styles.calm}>
            We&apos;re getting your accounts ready. Please check again in a
            moment.
          </Text>
        ) : null}

        {pending.map((d) => (
          <View key={d.id} style={styles.pending}>
            <Text style={styles.pendingLabel}>Direct Deposit Pending</Text>
            <Text style={styles.pendingAmount}>
              {formatMoney(d.amount_cents, settings)} — {d.label}
            </Text>
          </View>
        ))}

        {accounts?.map((a) => (
          <Pressable
            key={a.id}
            onPress={() =>
              router.push(`/(patient)/view/${id}/account/${a.id}`)
            }
            style={styles.account}
          >
            <Text style={styles.accountName}>{a.name}</Text>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balance}>
              {formatMoney(a.balance_cents, settings)}
            </Text>
          </Pressable>
        ))}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: patientType.heading,
    fontWeight: "700",
    color: colors.text,
  },
  calm: { fontSize: patientType.body, color: colors.textMuted },
  pending: {
    backgroundColor: colors.positiveSoft,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
  },
  pendingLabel: {
    fontSize: patientType.body,
    fontWeight: "700",
    color: colors.positive,
  },
  pendingAmount: { fontSize: patientType.body, color: colors.text },
  account: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  accountName: {
    fontSize: patientType.bodyLarge,
    fontWeight: "600",
    color: colors.text,
  },
  balanceLabel: { fontSize: patientType.body, color: colors.textMuted },
  balance: {
    fontSize: patientType.display,
    fontWeight: "700",
    color: colors.text,
  },
});
