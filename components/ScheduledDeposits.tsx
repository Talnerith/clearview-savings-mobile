import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, ChipGroup, Notice, TextField } from "@/components/ui";
import { api } from "@/lib/api";
import { formatMoney, type PatientSettings } from "@/lib/format";
import {
  listScheduledDeposits,
  type Account,
  type ScheduledDeposit,
} from "@/lib/queries";
import { useWrite } from "@/lib/use-write";
import { colors, space } from "@/lib/theme";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const FREQUENCIES = [
  { label: "Weekly", value: "weekly" as const },
  { label: "Biweekly", value: "biweekly" as const },
  { label: "Monthly", value: "monthly" as const },
];

// Caregiver scheduled-deposits section: list (with status) + pause/resume +
// delete, and an "Add scheduled deposit" form. Recurring deposits like a pension
// the patient sees as "Direct Deposit Pending" near the due date.
export function ScheduledDeposits({
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
  const [deposits, setDeposits] = useState<ScheduledDeposit[]>([]);
  const [adding, setAdding] = useState(false);

  const accountKey = accounts.map((a) => a.id).join(",");
  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "Account";

  const fetchDeposits = useCallback(async () => {
    try {
      const ids = accountKey ? accountKey.split(",") : [];
      setDeposits(await listScheduledDeposits(ids));
    } catch {
      setDeposits([]);
    }
  }, [accountKey]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  function reload() {
    fetchDeposits();
    onChanged();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Scheduled deposits</Text>

      {deposits.length === 0 ? (
        <Text style={styles.muted}>No scheduled deposits.</Text>
      ) : (
        deposits.map((d) => (
          <DepositRow
            key={d.id}
            patientId={patientId}
            deposit={d}
            accountName={accountName(d.account_id)}
            settings={settings}
            onChanged={reload}
          />
        ))
      )}

      {adding ? (
        <AddDepositForm
          patientId={patientId}
          accounts={accounts}
          onClose={() => setAdding(false)}
          onChanged={reload}
        />
      ) : (
        <Button
          label="Add a scheduled deposit"
          variant="secondary"
          onPress={() => setAdding(true)}
        />
      )}
    </View>
  );
}

function DepositRow({
  patientId,
  deposit,
  accountName,
  settings,
  onChanged,
}: {
  patientId: string;
  deposit: ScheduledDeposit;
  accountName: string;
  settings?: PatientSettings;
  onChanged: () => void;
}) {
  const { busy, error, run } = useWrite();

  async function onToggle() {
    const ok = await run(async () => {
      await api.toggleScheduledDeposit(patientId, deposit.id, !deposit.active);
    });
    if (ok) onChanged();
  }
  async function onDelete() {
    const ok = await run(async () => {
      await api.deleteScheduledDeposit(patientId, deposit.id);
    });
    if (ok) onChanged();
  }

  return (
    <Card>
      <View style={styles.depHeader}>
        <Text style={styles.depLabel}>{deposit.label}</Text>
        <Text style={styles.depAmount}>
          {formatMoney(deposit.amount_cents, settings)}
        </Text>
      </View>
      <Text style={styles.muted}>
        {accountName} · {deposit.frequency} ·{" "}
        {deposit.active ? "Active" : "Paused"}
      </Text>
      {error ? <Notice>{error}</Notice> : null}
      <View style={styles.depButtons}>
        <Button
          label={deposit.active ? "Pause" : "Resume"}
          variant="secondary"
          onPress={onToggle}
          loading={busy}
        />
        <Button
          label="Delete"
          variant="secondary"
          onPress={onDelete}
          loading={busy}
        />
      </View>
    </Card>
  );
}

function AddDepositForm({
  patientId,
  accounts,
  onClose,
  onChanged,
}: {
  patientId: string;
  accounts: Account[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]!.id);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] =
    useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [anchorDate, setAnchorDate] = useState("");
  const [pendingDays, setPendingDays] = useState("5");
  const { busy, error, run } = useWrite();

  const valid =
    label.trim().length > 0 &&
    AMOUNT_RE.test(amount.trim()) &&
    Number(amount) > 0 &&
    DATE_RE.test(anchorDate.trim());

  async function onSubmit() {
    const ok = await run(async () => {
      await api.addScheduledDeposit({
        patientId,
        accountId,
        label: label.trim(),
        amount: amount.trim(),
        frequency,
        anchorDate: anchorDate.trim(),
        pendingDays: Number(pendingDays) || 5,
      });
    });
    if (ok) {
      onClose();
      onChanged();
    }
  }

  return (
    <Card>
      <Text style={styles.formTitle}>Add a scheduled deposit</Text>

      <Text style={styles.fieldLabel}>Account</Text>
      <ChipGroup
        options={accounts.map((a) => ({ label: a.name, value: a.id }))}
        value={accountId}
        onChange={setAccountId}
      />

      <TextField label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Pension" maxLength={60} />
      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Text style={styles.fieldLabel}>Frequency</Text>
      <ChipGroup options={FREQUENCIES} value={frequency} onChange={setFrequency} />

      <TextField
        label="First date (YYYY-MM-DD)"
        value={anchorDate}
        onChangeText={setAnchorDate}
        placeholder="2026-07-01"
        autoCapitalize="none"
        maxLength={10}
      />
      <TextField
        label="Show as pending N days before (0–14)"
        value={pendingDays}
        onChangeText={(t) => setPendingDays(t.replace(/\D/g, "").slice(0, 2))}
        keyboardType="number-pad"
        placeholder="5"
      />

      {error ? <Notice>{error}</Notice> : null}
      <Button label="Add scheduled deposit" onPress={onSubmit} loading={busy} disabled={!valid} />
      <Button label="Cancel" variant="secondary" onPress={onClose} />
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, marginTop: space.lg },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  muted: { fontSize: 14, color: colors.textMuted },
  depHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
  },
  depLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  depAmount: { fontSize: 16, fontWeight: "700", color: colors.text },
  depButtons: { gap: space.xs },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  fieldLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
});
