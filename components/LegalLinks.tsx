import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/lib/theme";

const BASE = "https://clearviewsavings.com";
// "Report misuse" mirrors the web /about report-a-concern affordance
// (web ADR 0008): a caregiver-side way to flag an account being used to
// deceive someone outside a caregiving relationship. Opens the mail client.
const LINKS = [
  { label: "About", url: `${BASE}/about` },
  { label: "Privacy", url: `${BASE}/privacy` },
  { label: "Terms", url: `${BASE}/terms` },
  { label: "Security", url: `${BASE}/security` },
  {
    label: "Report misuse",
    url: "mailto:support@clearviewsavings.com?subject=Report%20misuse",
  },
];

// Caregiver-side legal/info links that open the web pages (these live on the
// web app; mobile links out rather than re-implementing them).
export function LegalLinks() {
  return (
    <View style={styles.row}>
      {LINKS.map((l) => (
        <Pressable
          key={l.label}
          onPress={() => Linking.openURL(l.url)}
          hitSlop={6}
        >
          <Text style={styles.link}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.md,
    marginTop: space.lg,
  },
  link: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
