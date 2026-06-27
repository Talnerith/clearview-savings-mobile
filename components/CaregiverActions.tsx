import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, ChipGroup, Notice, TextField } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isDemoActive } from "@/lib/demo";
import type { Account } from "@/lib/queries";
import { colors, space } from "@/lib/theme";

type Mode = "none" | "txn" | "transfer";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const KIND_OPTIONS = [
  { label: "Deposit", value: "deposit" as const },
  { label: "Withdrawal", value: "withdrawal" as const },
  { label: "Fee", value: "fee" as const },
  { label: "Adjustment", value: "adjustment" as const },
];

// Caregiver-only write actions on the patient detail screen: post a manual
// transaction or transfer between the patient's accounts. Both call the shared
// web endpoints (lib/api) so the balance logic isn't duplicated. Demo mode
// shows a calm "not saved" notice instead of hitting the backend.
export function CaregiverActions({
  patientId,
  accounts,
  onDone,
}: {
  patientId: string;
  accounts: Account[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("none");

  if (accounts.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Caregiver actions</Text>

      {mode === "none" ? (
        <View style={styles.menu}>
          <Button
            label="Add a transaction"
            variant="secondary"
            onPress={() => setMode("txn")}
          />
          {accounts.length >= 2 ? (
            <Button
              label="Transfer between accounts"
              variant="secondary"
              onPress={() => setMode("transfer")}
            />
          ) : null}
        </View>
      ) : null}

      {mode === "txn" ? (
        <ManualTxnForm
          patientId={patientId}
          accounts={accounts}
          onClose={() => setMode("none")}
          onDone={onDone}
        />
      ) : null}

      {mode === "transfer" ? (
        <TransferForm
          patientId={patientId}
          accounts={accounts}
          onClose={() => setMode("none")}
          onDone={onDone}
        />
      ) : null}
    </View>
  );
}

function useSubmit(run: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (isDemoActive()) {
      setError("Demo mode — changes aren’t saved.");
      return;
    }
    setBusy(true);
    try {
      await run();
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, done, submit };
}

function ManualTxnForm({
  patientId,
  accounts,
  onClose,
  onDone,
}: {
  patientId: string;
  accounts: Account[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [accountId, setAccountId] = useState<string>(accounts[0]!.id);
  const [kind, setKind] =
    useState<"deposit" | "withdrawal" | "fee" | "adjustment">("deposit");
  const [direction, setDirection] = useState<"increase" | "decrease">(
    "increase",
  );
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  const { busy, error, done, submit } = useSubmit(async () => {
    await api.manualTransaction({
      patientId,
      accountId,
      kind,
      amount,
      label: label.trim(),
      direction: kind === "adjustment" ? direction : undefined,
    });
    onDone();
  });

  const valid =
    AMOUNT_RE.test(amount.trim()) && Number(amount) > 0 && label.trim().length > 0;

  if (done) {
    return (
      <View style={styles.form}>
        <Notice>Transaction posted.</Notice>
        <Button label="Done" variant="secondary" onPress={onClose} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Add a transaction</Text>

      <Text style={styles.fieldLabel}>Account</Text>
      <ChipGroup
        options={accounts.map((a) => ({ label: a.name, value: a.id }))}
        value={accountId}
        onChange={setAccountId}
      />

      <Text style={styles.fieldLabel}>Type</Text>
      <ChipGroup options={KIND_OPTIONS} value={kind} onChange={setKind} />

      {kind === "adjustment" ? (
        <>
          <Text style={styles.fieldLabel}>Direction</Text>
          <ChipGroup
            options={[
              { label: "Increase", value: "increase" as const },
              { label: "Decrease", value: "decrease" as const },
            ]}
            value={direction}
            onChange={setDirection}
          />
        </>
      ) : null}

      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <TextField
        label="Description"
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Pharmacy"
        maxLength={80}
      />

      {error ? <Notice>{error}</Notice> : null}

      <Button label="Post transaction" onPress={submit} loading={busy} disabled={!valid} />
      <Button label="Cancel" variant="secondary" onPress={onClose} />
    </View>
  );
}

function TransferForm({
  patientId,
  accounts,
  onClose,
  onDone,
}: {
  patientId: string;
  accounts: Account[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]!.id);
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]!.id);
  const [amount, setAmount] = useState("");

  const { busy, error, done, submit } = useSubmit(async () => {
    await api.transfer({ patientId, fromAccountId, toAccountId, amount });
    onDone();
  });

  const valid =
    AMOUNT_RE.test(amount.trim()) &&
    Number(amount) > 0 &&
    fromAccountId !== toAccountId;

  if (done) {
    return (
      <View style={styles.form}>
        <Notice>Transfer completed.</Notice>
        <Button label="Done" variant="secondary" onPress={onClose} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Transfer between accounts</Text>

      <Text style={styles.fieldLabel}>From</Text>
      <ChipGroup
        options={accounts.map((a) => ({ label: a.name, value: a.id }))}
        value={fromAccountId}
        onChange={setFromAccountId}
      />

      <Text style={styles.fieldLabel}>To</Text>
      <ChipGroup
        options={accounts.map((a) => ({ label: a.name, value: a.id }))}
        value={toAccountId}
        onChange={setToAccountId}
      />

      {fromAccountId === toAccountId ? (
        <Notice>Choose two different accounts.</Notice>
      ) : null}

      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      {error ? <Notice>{error}</Notice> : null}

      <Button label="Transfer" onPress={submit} loading={busy} disabled={!valid} />
      <Button label="Cancel" variant="secondary" onPress={onClose} />
    </View>
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
  menu: { gap: space.sm },
  form: {
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: space.lg,
  },
  formTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  fieldLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
});
