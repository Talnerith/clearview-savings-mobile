import { useRouter } from "expo-router";
import { Linking, StyleSheet, Text, View } from "react-native";

import { Brandmark } from "@/components/Brandmark";
import { Screen } from "@/components/Screen";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { colors, space } from "@/lib/theme";

const WEB_2FA_URL = "https://clearviewsavings.com/caregiver/settings";

// Caregiver Settings. Two-factor authentication is managed on the web app (M3
// decision: MFA enroll/disable/recovery stays on web), so this screen shows the
// account, points to the web for 2FA, and offers sign out.
export default function Settings() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  async function onSignOut() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen contentStyle={{ gap: space.lg }}>
      <View style={styles.header}>
        <Brandmark size="md" />
        <Text style={styles.title}>Settings</Text>
        {session?.user.email ? (
          <Text style={styles.email}>Signed in as {session.user.email}</Text>
        ) : null}
      </View>

      <Card>
        <Text style={styles.cardTitle}>Security</Text>
        <Text style={styles.cardBody}>
          Two-factor authentication adds a one-time code from an authenticator
          app to your sign-in. Manage it from the web app.
        </Text>
        <Button
          label="Manage 2FA on the web"
          variant="secondary"
          onPress={() => Linking.openURL(WEB_2FA_URL)}
        />
      </Card>

      <Button label="Sign out" onPress={onSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs, marginTop: space.md },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  cardBody: { fontSize: 15, color: colors.textMuted },
});
