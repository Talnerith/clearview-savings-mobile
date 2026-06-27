import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Button, Card, Notice } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { pingBackend } from "@/lib/queries";
import {
  isSupabaseConfigured,
  supabase,
  supabaseUrlForDisplay,
} from "@/lib/supabase";
import { colors, space } from "@/lib/theme";

type CheckResult = {
  name: string;
  status: "pass" | "fail" | "info";
  detail: string;
};

// In-app backend test harness. Lets you verify, live on the device, that the
// app is wired to the SAME Supabase backend as the web app: env present, auth
// session valid, and an RLS-scoped read returns data. This is the "way to
// interact and test the backend in the app interface" — no external tooling.
export default function Diagnostics() {
  const router = useRouter();
  const { session, demo } = useAuth();
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [running, setRunning] = useState(false);

  // Explicit return path. The stack header has a back chevron, but this screen
  // is a utility a caregiver reaches mid-task; a clear button is easier to find
  // (and on web the header affordance is subtle). Fall back to a hard nav if
  // there's no history (e.g. opened via a deep link).
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/(caregiver)/patients");
  }

  async function runChecks() {
    setRunning(true);
    const checks: CheckResult[] = [];

    // In demo mode the env/auth checks are informational — there is no live
    // backend to reach. The RLS read below resolves against sample data.
    // 1. Env configured
    checks.push({
      name: "Environment",
      status: demo ? "info" : isSupabaseConfigured ? "pass" : "fail",
      detail: demo
        ? "Demo mode — no backend keys required"
        : isSupabaseConfigured
          ? `URL ${supabaseUrlForDisplay}`
          : "EXPO_PUBLIC_SUPABASE_* not set",
    });

    // 2. Auth session present and not expired
    const { data: sess } = await supabase.auth.getSession();
    checks.push({
      name: "Auth session",
      status: demo ? "info" : sess.session ? "pass" : "fail",
      detail: demo
        ? "Demo mode — no real session"
        : sess.session
          ? `Signed in as ${sess.session.user.email ?? sess.session.user.id}`
          : "No active session",
    });

    // 3. RLS-scoped read round-trip
    const ping = await pingBackend();
    checks.push({
      name: "RLS read (patients)",
      status: ping.ok ? "pass" : "fail",
      detail: ping.ok
        ? `${ping.patientCount} patient(s) visible · ${ping.ms}ms`
        : (ping.error ?? "Read failed"),
    });

    // 4. Access-token expiry, informational
    if (sess.session?.expires_at) {
      const secs = sess.session.expires_at - Math.floor(Date.now() / 1000);
      checks.push({
        name: "Token freshness",
        status: "info",
        detail:
          secs > 0
            ? `Access token valid for ~${Math.round(secs / 60)} min (auto-refreshes)`
            : "Token expired — will refresh on next request",
      });
    }

    setResults(checks);
    setRunning(false);
  }

  return (
    <Screen contentStyle={{ paddingBottom: space.xl }}>
      <Text style={styles.title}>Backend diagnostics</Text>
      <Text style={styles.sub}>
        Confirms this app is talking to the same Supabase backend as the web
        app, through the same Row-Level Security.
      </Text>

      {demo ? (
        <Notice>
          Demo mode is on — checks run against built-in sample data, not a live
          backend. Sign out and sign in to test the real connection.
        </Notice>
      ) : null}

      <Card>
        <Row
          label="Mode"
          value={demo ? "Demo (sample data)" : "Live backend"}
        />
        <Row label="Supabase URL" value={supabaseUrlForDisplay} />
        <Row
          label="Signed in"
          value={
            demo
              ? "demo mode"
              : (session?.user.email ?? (session ? session.user.id : "no"))
          }
        />
      </Card>

      <Button
        label={running ? "Running…" : "Run connection tests"}
        onPress={runChecks}
        loading={running}
      />

      {results?.map((r) => (
        <Card key={r.name}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultName}>{r.name}</Text>
            <Text style={[styles.badge, badgeStyle(r.status)]}>
              {r.status === "pass"
                ? "PASS"
                : r.status === "fail"
                  ? "FAIL"
                  : "INFO"}
            </Text>
          </View>
          <Text style={styles.resultDetail}>{r.detail}</Text>
        </Card>
      ))}

      {results && results.some((r) => r.status === "fail") ? (
        <Notice>
          One or more checks failed. Confirm .env.local matches the web app and
          that you are signed in.
        </Notice>
      ) : null}

      <View style={styles.backBlock}>
        <Button
          label="Back to patients"
          variant="secondary"
          onPress={goBack}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function badgeStyle(status: CheckResult["status"]) {
  if (status === "pass") return styles.badgePass;
  if (status === "fail") return styles.badgeFail;
  return styles.badgeInfo;
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.md,
  },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, flexShrink: 1 },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultName: { fontSize: 16, fontWeight: "600", color: colors.text },
  resultDetail: { fontSize: 14, color: colors.textMuted },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: 6,
    color: colors.textInverse,
  },
  badgePass: { backgroundColor: colors.positive },
  badgeFail: { backgroundColor: colors.destructive },
  badgeInfo: { backgroundColor: colors.textMuted },
  backBlock: { marginTop: space.md },
});
