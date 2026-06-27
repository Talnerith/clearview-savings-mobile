import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { BRAND_NAME } from "@/lib/branding";
import { isDemoActive } from "@/lib/demo";
import { formatMoney, type PatientSettings } from "@/lib/format";
import { getPatient } from "@/lib/queries";
import { colors, patientType, radius, space } from "@/lib/theme";

// Patient "Deposit a Check". The photo step is theatre on the web app; here the
// amount comes entirely from the single-use code the caregiver generated. Calm,
// large type, one primary action, never a raw error (patient UX rules). The
// redemption goes through the shared endpoint (lib/api) so the balance update +
// audit entry are identical to the web path.
export default function Deposit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [settings, setSettings] = useState<PatientSettings | undefined>();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ amountCents: number; label: string } | null>(
    null,
  );

  useEffect(() => {
    getPatient(id)
      .then((p) => setSettings(p?.settings))
      .catch(() => {});
  }, [id]);

  function onChangeCode(text: string) {
    // Keep only code-alphabet characters, upper-case, max 8 (the print shows it
    // in two 4-char groups, so a typed space is expected and simply dropped).
    const cleaned = text
      .toUpperCase()
      .replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, "")
      .slice(0, 8);
    setCode(cleaned);
  }

  async function onDeposit() {
    setMessage(null);
    if (code.length !== 8) {
      setMessage("Please enter the 8-character code from your check.");
      return;
    }
    setBusy(true);
    try {
      if (isDemoActive()) {
        // Demo walkthrough: show the calm success without a backend. No "demo"
        // wording reaches this patient-visible screen (branding rule).
        setDone({ amountCents: 5000, label: "Check deposit" });
      } else {
        const result = await api.redeemDeposit(id, code);
        setDone({ amountCents: result.amountCents, label: result.label });
      }
    } catch (e) {
      // Calm, non-technical fallback for any failure.
      setMessage(
        e instanceof ApiError && e.code === "invalid_or_used"
          ? "We couldn’t find that code. Please check it and try again."
          : "We couldn’t complete your deposit right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${BRAND_NAME} — Deposit a Check`,
          headerTitle: () => <Brandmark size="sm" />,
        }}
      />
      <Screen contentStyle={{ gap: space.lg }}>
        {done ? (
          <View style={styles.block}>
            <Text style={styles.heading}>Your deposit is complete</Text>
            <Text style={styles.amount}>
              {formatMoney(done.amountCents, settings)}
            </Text>
            <Text style={styles.body}>{done.label}</Text>
            <Button
              label="Back to your accounts"
              onPress={() => router.replace(`/(patient)/view/${id}/accounts`)}
            />
          </View>
        ) : (
          <View style={styles.block}>
            <Text style={styles.heading}>Deposit a Check</Text>
            <Text style={styles.body}>
              Enter the code printed on your check to add it to your account.
            </Text>

            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={onChangeCode}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="ABCD2345"
              placeholderTextColor={colors.textMuted}
              maxLength={8}
            />

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <Button label="Deposit" onPress={onDeposit} loading={busy} />
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.md },
  heading: {
    fontSize: patientType.heading,
    fontWeight: "700",
    color: colors.text,
  },
  body: { fontSize: patientType.body, color: colors.text },
  amount: {
    fontSize: patientType.display,
    fontWeight: "700",
    color: colors.positive,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    fontSize: 28,
    letterSpacing: 6,
    textAlign: "center",
    color: colors.text,
  },
  message: { fontSize: patientType.body, color: colors.notice },
});
