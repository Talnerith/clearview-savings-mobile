import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type KeyboardTypeOptions,
  View,
} from "react-native";

import { colors, radius, space } from "@/lib/theme";

// Small shared UI primitives. Kept intentionally minimal — no external UI kit,
// no client-state libraries (matches the web app's "what NOT to do" list).

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      // Mirrors the web button: darken on press + a subtle scale-down
      // (active:scale-[0.98]) so every tap visibly reacts.
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed &&
          (isPrimary ? styles.buttonPrimaryPressed : styles.buttonSecondaryPressed),
        pressed && styles.buttonPressedScale,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            isPrimary ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Notice({ children }: { children: ReactNode }) {
  // Calm inline notice — never a modal/toast/popover (patient UX rule).
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      {label ? <Text style={styles.loadingLabel}>{label}</Text> : null}
    </View>
  );
}

// Labeled text input — caregiver-side forms (standard density). Patient screens
// use their own large-type styling; this is for the admin surface.
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
    </View>
  );
}

// A single-select row of chips. Generic over the option value so callers stay
// type-safe (kinds, account ids, etc.).
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text
              style={[styles.chipLabel, selected && styles.chipLabelSelected]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryPressed: { backgroundColor: colors.primaryPressed },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryPressed: { backgroundColor: colors.secondaryPressed },
  buttonPressedScale: { transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { fontSize: 18, fontWeight: "600" },
  buttonLabelPrimary: { color: colors.textInverse },
  buttonLabelSecondary: { color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
    // Subtle lift so white cards separate from the neutral page (web parity).
    shadowColor: "#0a0a0a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  notice: {
    backgroundColor: colors.noticeSoft,
    borderRadius: radius.md,
    padding: space.md,
  },
  noticeText: { color: colors.notice, fontSize: 15 },
  loading: { padding: space.xl, alignItems: "center", gap: space.sm },
  loadingLabel: { color: colors.textMuted },
  fieldBlock: { gap: space.xs },
  fieldLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
  fieldInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 17,
    color: colors.text,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: { fontSize: 15, color: colors.text, fontWeight: "600" },
  chipLabelSelected: { color: colors.textInverse },
});
