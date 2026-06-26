import { StyleSheet, Text, View } from "react-native";

import { DISCLOSURE_TEXT } from "@/lib/branding";
import { colors, space } from "@/lib/theme";

// Regulatory disclosure carried on EVERY screen, both caregiver and patient
// surfaces (see CLAUDE.md "Branding architecture"). Small and calm enough not
// to break the therapeutic illusion for a patient, but present on every page
// the app serves. No per-screen opt-out — removing it requires a CLAUDE.md edit.
export function DisclosureFooter() {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.text}>{DISCLOSURE_TEXT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: "center",
  },
  text: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
});
