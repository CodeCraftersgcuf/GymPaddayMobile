import { Platform } from 'react-native';
import { initialWindowMetrics, type EdgeInsets } from 'react-native-safe-area-context';

/** Bottom inset for payment WebView — Modals on Android often report 0. */
export function getPaymentBottomInset(insets: EdgeInsets): number {
  if (insets.bottom > 0) return insets.bottom;

  const fallback = initialWindowMetrics?.insets.bottom ?? 0;
  if (fallback > 0) return fallback;

  // Three-button navigation bar when edge-to-edge leaves no reported inset.
  return Platform.OS === 'android' ? 48 : 0;
}
