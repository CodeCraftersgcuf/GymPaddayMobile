import { MEDIA_CDN_URL } from '@/apiConfig';

const FLUTTERWAVE_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ||
  'FLWPUBK-40e0f9f66bc483c5234bc8ca12529396-X';

export type FlutterwaveCheckoutParams = {
  amount: number;
  email: string;
  customerName: string;
  orderId?: string;
};

export function buildFlutterwaveCheckoutHtml({
  amount,
  email,
  customerName,
  orderId,
}: FlutterwaveCheckoutParams): string {
  const resolvedOrderId = orderId || `order_${Date.now()}`;
  const txRef = `txref_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>GymPaddy Payment</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
      padding-bottom: var(--gp-safe-bottom, 0px);
    }
    #status {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
      font-size: 14px;
      text-align: center;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div id="status">Opening secure payment...</div>
  <script>
    (function () {
      function post(event, extra) {
        if (!window.ReactNativeWebView) return;
        window.ReactNativeWebView.postMessage(JSON.stringify(
          Object.assign({ event: event }, extra || {})
        ));
      }

      function setStatus(text) {
        var el = document.getElementById('status');
        if (el) el.textContent = text;
      }

      function getSafeBottomInset() {
        var inline = window.__GP_SAFE_BOTTOM;
        if (typeof inline === 'number' && inline > 0) return inline;
        var css = getComputedStyle(document.documentElement).getPropertyValue('--gp-safe-bottom');
        var parsed = parseInt(css, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      }

      function padFlutterwaveUI() {
        var inset = getSafeBottomInset();
        if (!inset) return;
        document.body.style.paddingBottom = inset + 'px';
        var nodes = document.querySelectorAll('iframe, [style*="position: fixed"], [style*="position:fixed"]');
        nodes.forEach(function (node) {
          if (!node || !node.style) return;
          node.style.setProperty('margin-bottom', inset + 'px', 'important');
          if (node.tagName === 'IFRAME') {
            node.style.setProperty('max-height', 'calc(100vh - ' + inset + 'px)', 'important');
          }
        });
      }
      window.padFlutterwaveUI = padFlutterwaveUI;

      function openCheckout() {
        if (typeof FlutterwaveCheckout !== 'function') {
          post('failed', { error: 'Flutterwave SDK unavailable' });
          setStatus('Payment gateway failed to load. Please go back and try again.');
          return;
        }

        try {
          FlutterwaveCheckout({
            public_key: ${JSON.stringify(FLUTTERWAVE_PUBLIC_KEY)},
            tx_ref: ${JSON.stringify(txRef)},
            amount: ${amount},
            currency: 'NGN',
            payment_options: 'card,ussd,banktransfer',
            customer: {
              email: ${JSON.stringify(email)},
              name: ${JSON.stringify(customerName || email)},
            },
            callback: function (response) {
              var isSuccess =
                response.status === 'successful' ||
                response.status === 'completed' ||
                response.charge_response_code === '00';

              post(isSuccess ? 'success' : 'failed', { data: response });
            },
            onclose: function () {
              post('closed');
            },
            customizations: {
              title: 'GymPaddy',
              description: 'Wallet top-up · ${resolvedOrderId}',
              logo: ${JSON.stringify(`${MEDIA_CDN_URL}/logo.png`)},
            },
          });
          post('ready');
          setStatus('');
          padFlutterwaveUI();
          setInterval(padFlutterwaveUI, 400);
        } catch (error) {
          post('failed', { error: String(error && error.message ? error.message : error) });
          setStatus('Could not open payment. Please go back and try again.');
        }
      }

      var timeout = setTimeout(function () {
        post('failed', { error: 'Payment gateway timed out' });
        setStatus('Payment gateway timed out. Please go back and try again.');
      }, 20000);

      var script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = function () {
        clearTimeout(timeout);
        openCheckout();
      };
      script.onerror = function () {
        clearTimeout(timeout);
        post('failed', { error: 'Failed to load Flutterwave script' });
        setStatus('Could not load payment gateway. Check your connection and try again.');
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>`;
}

export const FLUTTERWAVE_WEBVIEW_PROPS = {
  originWhitelist: ['*'] as string[],
  mixedContentMode: 'always' as const,
  thirdPartyCookiesEnabled: true,
  sharedCookiesEnabled: true,
  allowsInlineMediaPlayback: true,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  setSupportMultipleWindows: false,
};
