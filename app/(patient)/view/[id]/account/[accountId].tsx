import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { HeaderBack } from "@/components/HeaderBack";
import { Screen } from "@/components/Screen";
import { Button, Loading } from "@/components/ui";
import { BRAND_NAME } from "@/lib/branding";
import {
  formatMoney,
  formatPatientDate,
  type PatientSettings,
} from "@/lib/format";
import {
  getAccount,
  getPatient,
  listTransactions,
  type Account,
  type Transaction,
} from "@/lib/queries";
import { colors, patientType, radius, space } from "@/lib/theme";

// Account detail — balance + "Recent Transactions". Read-only on mobile.
export default function AccountDetail() {
  const { id, accountId } = useLocalSearchParams<{
    id: string;
    accountId: string;
  }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [settings, setSettings] = useState<PatientSettings | undefined>();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Always-available return path: pop if we have history, else go to the
  // patient's accounts home (covers direct-URL / refresh, where the stack's
  // default back chevron is absent — the dead-end behind the /account/undefined
  // trap).
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(`/(patient)/view/${id}/accounts`);
  }

  const load = useCallback(async () => {
    try {
      const [patient, acct, transactions] = await Promise.all([
        getPatient(id),
        getAccount(accountId),
        listTransactions(accountId),
      ]);
      setSettings(patient?.settings);
      setAccount(acct);
      setTxns(transactions);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  }, [id, accountId]);

  useEffect(() => {
    load();
  }, [load]);

  // Native stacks already render a working back chevron (tap + swipe); only the
  // web build needs a custom one (the default chevron is absent on direct-URL /
  // refresh). Overriding headerLeft on native broke its back button.
  const headerOptions = {
    title: account?.name ?? BRAND_NAME,
    headerTitle: () => <Brandmark size="sm" />,
    ...(Platform.OS === "web"
      ? { headerLeft: () => <HeaderBack onPress={goBack} /> }
      : null),
  };

  if (!loaded) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen scroll={false}>
          <Loading />
        </Screen>
      </>
    );
  }

  // Account couldn't be loaded (not found / bad id / read failure). Show a calm
  // message with a clear way back, never a misleading $0.00 dead-end.
  if (failed || !account) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <Screen contentStyle={{ gap: space.lg }}>
          <Text style={styles.sectionTitle}>We couldn&apos;t find that account</Text>
          <Text style={styles.calm}>
            Please go back to your accounts and try again.
          </Text>
          <Button label="Back to your accounts" onPress={goBack} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <Screen contentStyle={{ gap: space.lg }}>
        <View style={styles.summary}>
          <Text style={styles.accountName}>{account?.name}</Text>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balance}>
            {formatMoney(account?.balance_cents ?? 0, settings)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {txns?.length === 0 ? (
          <Text style={styles.calm}>No recent transactions.</Text>
        ) : null}

        {txns?.map((t) => {
          const isCredit = t.kind === "deposit" || t.kind === "adjustment";
          const sign = isCredit ? "+" : "−";
          return (
            <View key={t.id} style={styles.txn}>
              <View style={styles.txnLeft}>
                <Text style={styles.txnLabel}>{t.label}</Text>
                <Text style={styles.txnDate}>
                  {formatPatientDate(t.posted_at, settings)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  isCredit ? styles.credit : styles.debit,
                ]}
              >
                {sign}
                {formatMoney(Math.abs(t.amount_cents), settings)}
              </Text>
            </View>
          );
        })}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  summary: {
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
  sectionTitle: {
    fontSize: patientType.heading,
    fontWeight: "700",
    color: colors.text,
  },
  calm: { fontSize: patientType.body, color: colors.textMuted },
  txn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
  },
  txnLeft: { flexShrink: 1, gap: 2 },
  txnLabel: { fontSize: patientType.body, color: colors.text, fontWeight: "600" },
  txnDate: { fontSize: 15, color: colors.textMuted },
  txnAmount: { fontSize: patientType.bodyLarge, fontWeight: "700" },
  credit: { color: colors.positive },
  debit: { color: colors.text },
});
