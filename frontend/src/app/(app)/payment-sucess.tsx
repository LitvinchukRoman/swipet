import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { donationService } from '@/services/donation';
import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';

// Stripe передає session_id як query param — використовуємо для верифікації
export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();

  const [verifying, setVerifying] = useState(!!session_id);
  const [verified,  setVerified]  = useState(false);

  // entrance animations
  const scale   = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const playEntrance = () => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start();
    });
  };

  useEffect(() => {
    if (!session_id) {
      // немає session_id — просто показуємо success без верифікації
      playEntrance();
      return;
    }

    // Опціонально: верифікувати статус через бекенд
    donationService.verifySession(session_id)
      .then(() => setVerified(true))
      .catch(() => setVerified(false))
      .finally(() => {
        setVerifying(false);
        playEntrance();
      });
  }, []);

  if (verifying) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0], alignItems: 'center', justifyContent: 'center', gap: Spacing[3] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>Verifying payment...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8], gap: Spacing[5] }}>

        {/* icon */}
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <View
            style={{
              width: 96, height: 96, borderRadius: 28,
              backgroundColor: Colors.primary[50],
              alignItems: 'center', justifyContent: 'center',
              ...Shadow.lg,
            }}
          >
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <CheckCircle size={52} color={Colors.primary[500]} strokeWidth={1.8} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* text */}
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing[2] }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.5, textAlign: 'center' }}>
            Payment successful!
          </Text>
          <Text style={{ fontSize: 15, color: Colors.neutral[400], textAlign: 'center', lineHeight: 22 }}>
            Thank you for your support. The shelter has been notified and will put your donation to great use. 🐾
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