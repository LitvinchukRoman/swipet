import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';

import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';

// ─── Налаштуй ці URL разом з бекенд розробником ──────────────────────────────
// Це ті самі URL які бекенд передає платіжному шлюзу як redirect після оплати
const SUCCESS_URL_PATTERN = 'swipet.ua/payment/success'; // або deep link 'swipet://payment/success'
const FAIL_URL_PATTERN    = 'swipet.ua/payment/fail';

// ─── Result screens ───────────────────────────────────────────────────────────
function ResultScreen({
  type,
  onClose,
  onRetry,
}: {
  type: 'success' | 'fail';
  onClose: () => void;
  onRetry?: () => void;
}) {
  const isSuccess = type === 'success';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8], gap: Spacing[5] }}>
      <View
        style={{
          width: 88, height: 88, borderRadius: 28,
          backgroundColor: isSuccess ? Colors.primary[50] : '#FEF2F2',
          alignItems: 'center', justifyContent: 'center',
          ...(isSuccess ? Shadow.orange : { shadowColor: Colors.error, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 }),
        }}
      >
        {isSuccess
          ? <CheckCircle size={44} color={Colors.primary[500]} strokeWidth={1.8} />
          : <XCircle    size={44} color={Colors.error}         strokeWidth={1.8} />
        }
      </View>

      <View style={{ alignItems: 'center', gap: Spacing[2] }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.neutral[900] }}>
          {isSuccess ? 'Payment successful!' : 'Payment failed'}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.neutral[400], textAlign: 'center', lineHeight: 21 }}>
          {isSuccess
            ? 'Thank you for your support! The shelter has been notified.'
            : 'Something went wrong with your payment. Please try again or use a different card.'
          }
        </Text>
      </View>

      <View style={{ width: '100%', gap: Spacing[3] }}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
            borderRadius: Radius.lg,
            height: 52,
            alignItems: 'center', justifyContent: 'center',
            ...Shadow.orange,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: Colors.neutral[0], fontSize: 15, fontWeight: '700' }}>
            {isSuccess ? 'Done' : 'Close'}
          </Text>
        </Pressable>

        {!isSuccess && onRetry && (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => ({
              borderWidth: 1.5,
              borderColor: Colors.neutral[200],
              borderRadius: Radius.lg,
              height: 52,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? Colors.neutral[50] : Colors.neutral[0],
            })}
          >
            <Text style={{ color: Colors.neutral[700], fontSize: 15, fontWeight: '600' }}>
              Try again
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PaymentWebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const webViewRef = useRef<WebView>(null);

  const [webLoading, setWebLoading] = useState(true);
  const [result,     setResult]     = useState<'success' | 'fail' | null>(null);
  const [loadError,  setLoadError]  = useState(false);

  // ── Перехоплення redirect від платіжного шлюзу ───────────────────────────
  const onNavigationStateChange = (state: WebViewNavigation) => {
    const { url: currentUrl } = state;
    if (!currentUrl) return;

    if (currentUrl.includes(SUCCESS_URL_PATTERN)) {
      setResult('success');
      return;
    }
    if (currentUrl.includes(FAIL_URL_PATTERN)) {
      setResult('fail');
      return;
    }
  };

  const handleClose = () => router.back();

  const handleRetry = () => {
    setResult(null);
    setLoadError(false);
    setWebLoading(true);
    webViewRef.current?.reload();
  };

  if (!url) {
    router.back();
    return null;
  }

  // ── Success / Fail result ────────────────────────────────────────────────
  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }} edges={['top', 'bottom']}>
        <ResultScreen
          type={result}
          onClose={handleClose}
          onRetry={result === 'fail' ? handleRetry : undefined}
        />
      </SafeAreaView>
    );
  }

  // ── WebView ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }} edges={['top']}>

      {/* top bar */}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
          borderBottomWidth: 1, borderBottomColor: Colors.neutral[100],
          gap: Spacing[3],
        }}
      >
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <ArrowLeft size={20} color={Colors.neutral[700]} strokeWidth={1.8} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.neutral[900] }}>
            Secure Payment
          </Text>
          {/* progress bar замість URL — виглядає чистіше */}
          {webLoading && (
            <View style={{ height: 2, backgroundColor: Colors.neutral[100], borderRadius: 1, marginTop: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: '70%', backgroundColor: Colors.primary[400], borderRadius: 1 }} />
            </View>
          )}
        </View>

        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <RefreshCw size={16} color={Colors.neutral[500]} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* webview */}
      {loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[4], paddingHorizontal: Spacing[8] }}>
          <XCircle size={44} color={Colors.neutral[300]} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.neutral[700], textAlign: 'center' }}>
            Could not load payment page
          </Text>
          <Text style={{ fontSize: 14, color: Colors.neutral[400], textAlign: 'center', lineHeight: 21 }}>
            Check your internet connection and try again.
          </Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
              backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
              borderRadius: Radius.lg, height: 48,
              paddingHorizontal: Spacing[8],
             justifyContent: 'center',
              ...Shadow.orange,
            })}
          >
            <RefreshCw size={15} color={Colors.neutral[0]} strokeWidth={2} />
            <Text style={{ color: Colors.neutral[0], fontSize: 15, fontWeight: '700' }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
            onError={() => { setWebLoading(false); setLoadError(true); }}
            onHttpError={(e) => {
              // ігноруємо redirect-и шлюзу (3xx), реагуємо тільки на реальні помилки
              if (e.nativeEvent.statusCode >= 400) {
                setWebLoading(false);
                setLoadError(true);
              }
            }}
            onNavigationStateChange={onNavigationStateChange}
            style={{ flex: 1 }}
          />
          {webLoading && (
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: Colors.neutral[0],
                alignItems: 'center', justifyContent: 'center',
                gap: Spacing[3],
              }}
            >
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>
                Loading payment page...
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}