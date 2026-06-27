import { Turnstile } from "@marsidev/react-turnstile";
import { View } from "react-native";

import { space } from "@/lib/theme";

import type { TurnstileGateProps } from "./turnstile-types";

// Web build (Expo web is React DOM, so the @marsidev DOM widget renders inline).
export function TurnstileGate({
  siteKey,
  onToken,
  onError,
  onExpire,
}: TurnstileGateProps) {
  return (
    <View style={{ marginVertical: space.sm, alignItems: "center" }}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={onToken}
        onError={() => onError?.()}
        onExpire={() => onExpire?.()}
        options={{ theme: "light" }}
      />
    </View>
  );
}
