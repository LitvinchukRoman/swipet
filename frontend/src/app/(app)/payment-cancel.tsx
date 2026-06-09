import { router } from 'expo-router';
import { ArrowLeft, XCircle } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Shadow, Spacing } from '@/lib/theme';

export default function PaymentCancelScreen() {
  const scale      = useRef(new Animated.Value(0.5)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start();
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8], gap: Spacing[5] }}>

        {/* icon */}
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <View
            style={{
              width: 96, height: 96, borderRadius: 28,
              backgroundColor: '#FEF2F2',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: Colors.error,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <XCircle size={52} color={Colors.error} strokeWidth={1.8} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* text */}
        <Animated.View style={{ opacity, alignItems: 'center', gap: Spacing[2] }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.5, textAlign: 'center' }}>
            Payment cancelled
          </Text>
          <Text style={{ fontSize: 15, color: Colors.neutral[400], textAlign: 'center', lineHeight: 22 }}>
            No worries — you haven't been charged. You can try again anytime.
          </Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View style={{ opacity, width: '100%', gap: Spacing[3] }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
              borderRadius: Radius.lg, height: 56,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: Spacing[2],
              ...Shadow.orange,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <ArrowLeft size={18} color={Colors.neutral[0]} strokeWidth={2} />
            <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
              Try again
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(app)/(tabs)')}
            style={({ pressed }) => ({
              borderWidth: 1.5, borderColor: Colors.neutral[200],
              borderRadius: Radius.lg, height: 52,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? Colors.neutral[50] : Colors.neutral[0],
            })}
          >
            <Text style={{ color: Colors.neutral[600], fontSize: 15, fontWeight: '600' }}>
              Back to feed
            </Text>
          </Pressable>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}