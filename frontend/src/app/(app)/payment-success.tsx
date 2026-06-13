import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { donationService, type PaymentVerificationStatus } from '@/services/donation';
import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';

// Один екран на три результати: success / pending / failed.
// Status беремо реально з бекенду (verify-session → Stripe), а не optimistic.
type ViewStatus = PaymentVerificationStatus;

const COPY: Record<ViewStatus, {
  icon: typeof CheckCircle;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
}> = {
  success: {
    icon: CheckCircle,
    iconColor: Colors.primary[500],
    iconBg: Colors.primary[50],
    title: 'Payment successful!',
    subtitle: 'Thank you for your support. The shelter has been notified and will put your donation to great use. 🐾',
  },
  pending: {
    icon: Clock,
    iconColor: Colors.warning,
    iconBg: '#FEF3C7',
    title: 'Payment processing',
    subtitle: "We're still confirming your payment with the bank. This can take a moment — we'll update your support automatically once it clears.",
  },
  failed: {
    icon: XCircle,
    iconColor: Colors.error,
    iconBg: '#FEE2E2',
    title: 'Payment not completed',
    subtitle: "Your payment didn't go through and you haven't been charged. You can try again whenever you're ready.",
  },
};

// Stripe передає session_id як query param — використовуємо для верифікації
export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();

  const [verifying, setVerifying] = useState(!!session_id);
  // Помилка мережі / невідомий стан → 'pending' (НЕ показуємо хибне підтвердження).
  const [status, setStatus] = useState<ViewStatus>('pending');

  const scale      = useRef(new Animated.Value(0.5)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;
  const entered    = useRef(false);

  const playEntrance = () => {
    if (entered.current) return;
    entered.current = true;
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start();
    });
  };

  useEffect(() => {
    // Прямий перехід без session_id — нема що верифікувати, не показуємо фейковий success.
    if (!session_id) {
      router.replace('/(app)/(tabs)');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 4; // верифікуємо, поки вебхук «доганяє» Stripe

    const poll = () => {
      donationService.verifySession(session_id)
        .then((res) => {
          if (cancelled) return;
          const s = res.status ?? 'pending';
          setStatus(s);
          setVerifying(false);
          playEntrance();
          // Платіж ще обробляється — перевіримо ще кілька разів.
          if (s === 'pending' && attempts < MAX_ATTEMPTS) {
            attempts += 1;
            setTimeout(poll, 3000);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setStatus('pending');
          setVerifying(false);
          playEntrance();
        });
    };

    poll();
    return () => { cancelled = true; };
  }, []);

  if (verifying) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0], alignItems: 'center', justifyContent: 'center', gap: Spacing[3] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>Verifying payment…</Text>
      </SafeAreaView>
    );
  }

  const copy = COPY[status];
  const Icon = copy.icon;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8], gap: Spacing[5] }}>

        {/* icon */}
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <View
            style={{
              width: 96, height: 96, borderRadius: 28,
              backgroundColor: copy.iconBg,
              alignItems: 'center', justifyContent: 'center',
              ...Shadow.lg,
            }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Icon size={52} color={copy.iconColor} strokeWidth={1.8} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* text */}
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing[2] }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.5, textAlign: 'center' }}>
            {copy.title}
          </Text>
          <Text style={{ fontSize: 15, color: Colors.neutral[400], textAlign: 'center', lineHeight: 22 }}>
            {copy.subtitle}
          </Text>
          {session_id && (
            <Text style={{ fontSize: 11, color: Colors.neutral[300], marginTop: Spacing[1] }}>
              Session: {session_id.slice(0, 20)}…
            </Text>
          )}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ opacity, width: '100%', gap: Spacing[3] }}>
          <Pressable
            onPress={() => router.replace('/(app)/(tabs)')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
              borderRadius: Radius.lg, height: 56,
              alignItems: 'center', justifyContent: 'center',
              ...Shadow.orange,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
              Back to feed
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(app)/guardianship')}
            style={({ pressed }) => ({
              borderWidth: 1.5, borderColor: Colors.neutral[200],
              borderRadius: Radius.lg, height: 52,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? Colors.neutral[50] : Colors.neutral[0],
            })}
          >
            <Text style={{ color: Colors.neutral[600], fontSize: 15, fontWeight: '600' }}>
              View my guardianships
            </Text>
          </Pressable>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}
