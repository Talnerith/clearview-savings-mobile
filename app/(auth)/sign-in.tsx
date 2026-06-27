import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { Screen } from "@/components/Screen";
import { TurnstileGate } from "@/components/TurnstileGate";
import { Button, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors, radius, space } from "@/lib/theme";

const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;

// Caregiver sign-in against the shared Supabase Auth. Same credentials as the
// web app. Patients never sign in here — patient view is reached from the
// caregiver's authenticated session. The project enforces Cloudflare Turnstile
// on Auth, so we render the widget and pass its token as captchaToken.
export default function SignIn() {
  const router = useRouter();
  const { signInWithPassword, enterDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this remounts the Turnstile widget to fetch a fresh single-use
  // token after each attempt (tokens are consumed on use / expire).
  const [turnstileKey, setTurnstileKey] = useState(0);

  function resetCaptcha() {
    setCaptchaToken(null);
    setTurnstileKey((k) => k + 1);
  }

  async function onExploreDemo() {
    await enterDemo();
    router.replace("/(caregiver)/patients");
  }

  async function onSubmit() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Just a moment — finishing the security check, then tap again.");
      return;
    }

    setBusy(true);
    const { error: signInError, mfaRequired } = await signInWithPassword(
      email,
      password,
      captchaToken ?? undefined,
    );
    setBusy(false);
    // The token has now been consumed (or the attempt failed); get a fresh one.
    resetCaptcha();

    if (signInError) {
      setError(signInError);
      return;
    }
    if (mfaRequired) {
      router.replace("/(auth)/challenge");
      return;
    }
    router.replace("/(caregiver)/patients");
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Brandmark size="lg" />
        <Text style={styles.subtitle}>Caregiver sign in</Text>
      </View>

      {/* Developer hint only — never shown in a production/web-demo build, where
          the path for a visitor is the "Explore in demo mode" button below. */}
      {__DEV__ && !isSupabaseConfigured && (
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

      {TURNSTILE_SITE_KEY ? (
        <TurnstileGate
          key={turnstileKey}
          siteKey={TURNSTILE_SITE_KEY}
          onToken={setCaptchaToken}
          onError={() => setCaptchaToken(null)}
          onExpire={() => setCaptchaToken(null)}
        />
      ) : __DEV__ ? (
        <Notice>
          EXPO_PUBLIC_TURNSTILE_SITE_KEY is not set — real sign-in is blocked by
          the captcha gate. Add it to .env.local to test live sign-in.
        </Notice>
      ) : null}

      {error ? <Notice>{error}</Notice> : null}

      <Button label="Sign in" onPress={onSubmit} loading={busy} />

      <View style={styles.demoBlock}>
        <Text style={styles.demoHint}>
          No account? Explore the app with sample data — no backend needed.
        </Text>
        <Button
          label="Explore in demo mode"
          variant="secondary"
          onPress={onExploreDemo}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginBottom: space.md, marginTop: space.lg },
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
  demoBlock: {
    marginTop: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  demoHint: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
