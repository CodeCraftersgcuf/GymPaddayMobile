import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLUTTERWAVE_WEBVIEW_PROPS } from '@/utils/flutterwaveCheckout';
import { getPaymentBottomInset } from '@/utils/paymentSafeArea';

type FlutterwaveWebViewProps = {
  html: string;
  dark?: boolean;
  onMessage: (event: WebViewMessageEvent) => void;
};

export default function FlutterwaveWebView({ html, dark, onMessage }: FlutterwaveWebViewProps) {
  const [showLoader, setShowLoader] = useState(true);
  const readyRef = useRef(false);
  const insets = useSafeAreaInsets();
  // Only pad the WebView when the parent did not already apply a bottom inset (common in Modals).
  const webViewBottomInset =
    insets.bottom > 0 ? 0 : getPaymentBottomInset(insets);

  const safeAreaScript = `
    (function () {
      window.__GP_SAFE_BOTTOM = ${webViewBottomInset};
      document.documentElement.style.setProperty('--gp-safe-bottom', '${webViewBottomInset}px');
      if (typeof window.padFlutterwaveUI === 'function') {
        window.padFlutterwaveUI();
      }
    })();
    true;
  `;

  useEffect(() => {
    setShowLoader(true);
    readyRef.current = false;

    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setShowLoader(false);
      }
    }, 20000);

    return () => clearTimeout(timeout);
  }, [html]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.event === 'ready') {
        readyRef.current = true;
        setShowLoader(false);
      }
      if (['success', 'failed', 'closed'].includes(payload?.event)) {
        setShowLoader(false);
      }
    } catch {
      // Parent still parses the payload.
    }
    onMessage(event);
  };

  return (
    <View style={[styles.wrapper, webViewBottomInset > 0 && { paddingBottom: webViewBottomInset }]}>
      <WebView
        source={{ html, baseUrl: 'https://checkout.flutterwave.com' }}
        style={styles.webView}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={safeAreaScript}
        injectedJavaScript={safeAreaScript}
        onLoadEnd={() => {
          if (!readyRef.current) {
            setShowLoader(false);
          }
        }}
        onError={() => setShowLoader(false)}
        onHttpError={() => setShowLoader(false)}
        {...FLUTTERWAVE_WEBVIEW_PROPS}
      />
      {showLoader ? (
        <View style={[styles.loadingOverlay, { backgroundColor: dark ? '#000' : '#fff' }]}>
          <ActivityIndicator size="large" color="#C61F3A" />
          <Text style={[styles.loadingText, { color: dark ? '#fff' : '#666' }]}>
            Opening payment gateway...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});
