import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, Notice, TextField } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCaregiverDate, formatMoney, type PatientSettings } from "@/lib/format";
import { listTransactions, type Account, type Transaction } from "@/lib/queries";
import { useWrite } from "@/lib/use-write";
import { colors, space } from "@/lib/theme";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

// Caregiver accounts section: each account shows its balance + recent
// transactions inline (matching the web caregiver view) and a rename control;
// if the patient has no savings account yet, an "Add savings account" form.
export function AccountManager({
  patientId,
  accounts,
  settings,
  onChanged,
}: {
  patientId: string;
  accounts: Account[];
  settings?: PatientSettings;
  onChanged: () => void;
}) {
  const hasSavings = accounts.some((a) => a.type === "savings");

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Accounts</Text>
      {accounts.map((a) => (
        <AccountRow
          key={a.id}
          patientId={patientId}
          account={a}
          settings={settings}
          onChanged={onChanged}
        />
      ))}
      {!hasSavings ? (
        <AddSavingsForm patientId={patientId} onChanged={onChanged} />
      ) : null}
    </View>
  );
}

function AccountRow({
  patientId,
  account,
  settings,
  onChanged,
}: {
  patientId: string;
  account: Account;
  settings?: PatientSettings;
  onChanged: () => void;
}) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(account.name);
  const { busy, error, run } = useWrite();

  const loadTxns = useCallback(async () => {
    try {
      setTxns(await listTransactions(account.id, 5));
    } catch {
      setTxns([]);
    }
  }, [account.id]);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  async function onSaveName() {
    const ok = await run(async () => {
      await api.renameAccount(patientId, account.id, name.trim());
    });
    if (ok) {
      setRenaming(false);
      onChanged();
    }
  }

  return (
    <Card>
      <View style={styles.acctHeader}>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.acctName}>{account.name}</Text>
          <Text style={styles.acctType}>
            {account.type === "checking" ? "Checking" : "Savings"}
          </Text>
        </View>
        <Text style={styles.acctBalance}>
          {formatMoney(account.balance_cents, settings)}
        </Text>
      </View>

      {txns.length === 0 ? (
        <Text style={styles.muted}>No recent transactions.</Text>
      ) : (
        txns.map((t) => {
          const credit = t.kind === "deposit" || t.kind === "adjustment";
          return (
            <View key={t.id} style={styles.txn}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.txnLabel}>{t.label}</Text>
                <Text style={styles.txnDate}>
                  {formatCaregiverDate(t.posted_at)}
                </Text>
              </View>
              <Text
                style={[styles.txnAmt, credit ? styles.credit : styles.debit]}
              >
                {credit ? "+" : "−"}
                {formatMoney(Math.abs(t.amount_cents), settings)}
              </Text>
            </View>
          );
        })
      )}

      {renaming ? (
        <View style={styles.renameRow}>
          <TextField label="Rename" value={name} onChangeText={setName} maxLength={40} />
          {error ? <Notice>{error}</Notice> : null}
          <View style={styles.renameButtons}>
            <Button label="Save" onPress={onSaveName} loading={busy} disabled={!name.trim()} />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => {
                setName(account.name);
                setRenaming(false);
              }}
            />
          </View>
        </View>
      ) : (
        <Button
          label="Rename account"
          variant="secondary"
          onPress={() => setRenaming(true)}
        />
      )}
    </Card>
  );
}

function AddSavingsForm({
  patientId,
  onChanged,
}: {
  patientId: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Savings");
  const [starting, setStarting] = useState("");
  const { busy, error, run } = useWrite();

  async function onSubmit() {
    const ok = await run(async () => {
      await api.addAccount(patientId, name.trim(), starting.trim() || "0");
    });
    if (ok) {
      setOpen(false);
      setStarting("");
      onChanged();
    }
  }

  const validStarting = starting.trim() === "" || AMOUNT_RE.test(starting.trim());

  if (!open) {
    return (
      <Button
        label="Add savings account"
        variant="secondary"
        onPress={() => setOpen(true)}
      />
    );
  }

  return (
    <Card>
      <Text style={styles.formTitle}>Add savings account</Text>
      <TextField label="Name" value={name} onChangeText={setName} maxLength={40} />
      <TextField
        label="Starting balance (optional)"
        value={starting}
        onChangeText={setStarting}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      {error ? <Notice>{error}</Notice> : null}
      <Button
        label="Add account"
        onPress={onSubmit}
        loading={busy}
        disabled={!name.trim() || !validStarting}
      />
      <Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  acctHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.md,
  },
  acctName: { fontSize: 18, fontWeight: "600", color: colors.text },
  acctType: { fontSize: 13, color: colors.textMuted },
  acctBalance: { fontSize: 20, fontWeight: "700", color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  txn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  txnLabel: { fontSize: 15, color: colors.text, fontWeight: "600" },
  txnDate: { fontSize: 13, color: colors.textMuted },
  txnAmt: { fontSize: 15, fontWeight: "700" },
  credit: { color: colors.positive },
  debit: { color: colors.text },
  renameRow: { gap: space.sm, marginTop: space.xs },
  renameButtons: { gap: space.xs },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
});
