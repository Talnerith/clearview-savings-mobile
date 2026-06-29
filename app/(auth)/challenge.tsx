import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { Screen } from "@/components/Screen";
import { Button, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, radius, space } from "@/lib/theme";

// MFA step-up: a caregiver with a verified TOTP factor has completed the
// password step (AAL1) and must enter their authenticator code to reach the
// dashboard (AAL2). Enrollment / disabling / recovery codes stay on the web app
// for now (M2 handles the challenge only).
export default function Challenge() {
  const router = useRouter();
  const { verifyTotp, signOut } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onVerify() {
    setError(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    const { error: verifyError } = await verifyTotp(code);
    setBusy(false);
    if (verifyError) {
      setError(verifyError);
      setCode("");
      return;
    }
    router.replace("/(caregiver)/patients");
  }

  async function onCancel() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Brandmark size="lg" />
        <Text style={styles.subtitle}>Verify it&apos;s you</Text>
      </View>

      <Text style={styles.body}>
        Enter the 6-digit code from your authenticator app to finish signing in.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Authentication code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          placeholderTextColor={colors.textMuted}
          maxLength={6}
        />
      </View>

      {error ? <Notice>{error}</Notice> : null}

      <Button label="Verify" onPress={onVerify} loading={busy} />
      <View style={styles.cancelBlock}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginBottom: space.md, marginTop: space.lg },
  subtitle: { fontSize: 16, color: colors.textMuted },
  body: { fontSize: 16, color: colors.text, marginBottom: space.sm },
  field: { gap: space.xs },
  label: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.text,
  },
  cancelBlock: { marginTop: space.sm },
});
