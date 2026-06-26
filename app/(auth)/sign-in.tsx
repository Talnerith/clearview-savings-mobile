import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/branding";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors, radius, space } from "@/lib/theme";

// Caregiver sign-in against the shared Supabase Auth. Same credentials as the
// web app. Patients never sign in here — patient view is reached from the
// caregiver's authenticated session.
export default function SignIn() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    const { error } = await signInWithPassword(email, password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    router.replace("/(caregiver)/patients");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>{BRAND_NAME}</Text>
        <Text style={styles.subtitle}>Caregiver sign in</Text>
      </View>

      {!isSupabaseConfigured && (
        <Notice>
          Backend keys are not configured. Copy .env.example to .env.local and
          fill in the Supabase values from the web app.
        </Notice>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {error ? <Notice>{error}</Notice> : null}

      <Button label="Sign in" onPress={onSubmit} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs, marginBottom: space.md, marginTop: space.lg },
  brand: { fontSize: 32, fontWeight: "700", color: colors.primary },
  subtitle: { fontSize: 16, color: colors.textMuted },
  field: { gap: space.xs },
  label: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    color: colors.text,
  },
});
