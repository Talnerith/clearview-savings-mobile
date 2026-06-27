import { Pressable, StyleSheet, Text } from "react-native";

import { colors, space } from "@/lib/theme";

// A nav-bar back control that is ALWAYS present — unlike the stack's default
// header chevron, which only renders when there is history to pop. Reaching a
// screen by direct URL or a page refresh (common on the web build) leaves the
// default chevron absent and the screen a dead-end; callers pass an explicit
// fallback so back always works. Bank-style "‹ Back" so it reads like a real
// banking app on the patient surface.
export function HeaderBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>‹ Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: space.xs, paddingHorizontal: space.sm },
  pressed: { opacity: 0.6 },
  label: { color: colors.primary, fontSize: 17, fontWeight: "600" },
});
