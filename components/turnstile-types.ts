// Shared contract for the platform-split TurnstileGate (native: react-native-
// webview; web: @marsidev/react-turnstile). Metro resolves TurnstileGate.web.tsx
// for web and TurnstileGate.tsx for native; both must satisfy this shape.
export type TurnstileGateProps = {
  // Cloudflare Turnstile public site key (EXPO_PUBLIC_TURNSTILE_SITE_KEY) — the
  // same value as the web app's NEXT_PUBLIC_TURNSTILE_SITE_KEY.
  siteKey: string;
  // Fired with a fresh token when the widget solves. The token is single-use
  // and short-lived; remount the gate (via a changing `key`) to get a new one.
  onToken: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
};
