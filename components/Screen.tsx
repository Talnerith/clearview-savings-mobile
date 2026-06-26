import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DisclosureFooter } from "@/components/DisclosureFooter";
import { colors, space } from "@/lib/theme";

// Standard screen frame: safe-area padding, a scrollable body, and the
// always-present disclosure footer pinned below the content.
export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: object;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex, contentStyle]}>
          {children}
        </View>
      )}
      <DisclosureFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: space.lg,
    gap: space.md,
    // Phone-width column, centered. On a phone this just fills the screen; on
    // the web demo it keeps the layout looking like a mobile app instead of
    // stretching inputs/buttons across the whole desktop window.
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  flex: { flex: 1 },
});
