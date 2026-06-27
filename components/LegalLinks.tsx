import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/lib/theme";

const BASE = "https://clearviewsavings.com";
const LINKS = [
  { label: "About", path: "/about" },
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Security", path: "/security" },
];

// Caregiver-side legal/info links that open the web pages (these live on the
// web app; mobile links out rather than re-implementing them).
export function LegalLinks() {
  return (
    <View style={styles.row}>
      {LINKS.map((l) => (
        <Pressable
          key={l.path}
          onPress={() => Linking.openURL(BASE + l.path)}
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
