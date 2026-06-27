import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Card, ChipGroup, Notice, TextField } from "@/components/ui";
import { api } from "@/lib/api";
import { type Patient } from "@/lib/queries";
import { useWrite } from "@/lib/use-write";
import { colors, space } from "@/lib/theme";

const LOCALE_RE = /^[a-z]{2}-[A-Z]{2}$/;
const FONT_SIZES = [
  { label: "Large", value: "lg" as const },
  { label: "Extra large", value: "xl" as const },
  { label: "Largest", value: "2xl" as const },
];

function initialFontSize(p: Patient): "lg" | "xl" | "2xl" {
  // The stored value uses the web app's scale (lg/xl/2xl); the mobile
  // PatientSettings type is narrower, so read it loosely.
  const f = p.settings?.font_size as string | undefined;
  return f === "xl" || f === "2xl" ? f : "lg";
}

// Caregiver "patient settings": display name, font size, and locale. Currency
// follows the locale automatically (server-side), so it isn't shown.
export function PatientSettingsForm({
  patient,
  onChanged,
}: {
  patient: Patient;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(patient.display_name);
  const [fontSize, setFontSize] = useState<"lg" | "xl" | "2xl">(
    initialFontSize(patient),
  );
  const [locale, setLocale] = useState(patient.settings?.locale ?? "en-US");
  const { busy, error, run } = useWrite();

  const valid = displayName.trim().length > 0 && LOCALE_RE.test(locale.trim());

  async function onSubmit() {
    const ok = await run(async () => {
      await api.updatePatientSettings({
        patientId: patient.id,
        displayName: displayName.trim(),
        fontSize,
        locale: locale.trim(),
      });
    });
    if (ok) {
      setOpen(false);
      onChanged();
    }
  }

  if (!open) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.sectionLabel}>Patient settings</Text>
        <Button
          label="Edit patient settings"
          variant="secondary"
          onPress={() => setOpen(true)}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Patient settings</Text>
      <Card>
        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={60}
        />

        <Text style={styles.fieldLabel}>Font size</Text>
        <ChipGroup options={FONT_SIZES} value={fontSize} onChange={setFontSize} />

        <TextField
          label="Locale (e.g. en-US, en-CA, fr-FR)"
          value={locale}
          onChangeText={setLocale}
          autoCapitalize="none"
          maxLength={5}
        />

        {error ? <Notice>{error}</Notice> : null}
        <Button label="Save settings" onPress={onSubmit} loading={busy} disabled={!valid} />
        <Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, marginTop: space.lg },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabel: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
});
