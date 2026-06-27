import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { TurnstileGateProps } from "./turnstile-types";

// Native build (iOS/Android): host the Turnstile widget in a tiny WebView and
// post the token back over the RN bridge.
//
// Cloudflare validates the document hostname against the site key's allowed
// domains. Inline HTML in a WebView has no real hostname, so we set the
// WebView's `baseUrl` to a host the key permits (EXPO_PUBLIC_TURNSTILE_HOST,
// default the production web origin). If sign-in returns a captcha rejection on
// device, that host almost certainly isn't in the key's allow-list yet.
const TURNSTILE_HOST =
  process.env.EXPO_PUBLIC_TURNSTILE_HOST ?? "https://clearviewsavings.com";

function buildHtml(siteKey: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
      html, body { margin: 0; padding: 0; background: transparent; }
      .wrap { display: flex; justify-content: center; align-items: center; min-height: 70px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div
        class="cf-turnstile"
        data-sitekey="${siteKey}"
        data-theme="light"
        data-callback="onTok"
        data-error-callback="onErr"
        data-expired-callback="onExp"
      ></div>
    </div>
    <script>
      function post(type, token) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, token: token || null }));
      }
      function onTok(t) { post("token", t); }
      function onErr() { post("error"); }
      function onExp() { post("expire"); }
    </script>
  </body>
</html>`;
}

export function TurnstileGate({
  siteKey,
  onToken,
  onError,
  onExpire,
}: TurnstileGateProps) {
  const html = useMemo(() => buildHtml(siteKey), [siteKey]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string;
        token?: string | null;
      };
      if (msg.type === "token" && msg.token) onToken(msg.token);
      else if (msg.type === "error") onError?.();
      else if (msg.type === "expire") onExpire?.();
    } catch {
      // Non-JSON bridge noise — ignore.
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: TURNSTILE_HOST }}
        onMessage={onMessage}
        javaScriptEnabled
        scrollEnabled={false}
        style={styles.webview}
        // Transparent so it sits on the neutral sign-in background.
        containerStyle={styles.webviewContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 80, marginVertical: 8 },
  webview: { backgroundColor: "transparent" },
  webviewContainer: { backgroundColor: "transparent" },
});
