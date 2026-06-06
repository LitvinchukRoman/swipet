import { router } from 'expo-router';
import {
  CheckCircle,
  Heart,
  Repeat2,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { donationService } from '@/services/donation';
import { Colors, Duration, Radius, Shadow, Spacing } from '@/lib/theme';

// ─── Types ────────────────────────────────────
export type DonationMode = 'ONE_TIME' | 'GUARDIANSHIP';

export interface DonationSheetProps {
  visible: boolean;
  onClose: () => void;
  animalId: number;
  animalName: string;
  shelterId: number;
  initialMode?: DonationMode;
}

// ─── Constants ────────────────────────────────
const ONE_TIME_PRESETS     = [50, 100, 200];
const GUARDIANSHIP_PRESETS = [100, 200, 500];

// ─── Spring press hook ────────────────────────
function usePress() {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, damping: 12, stiffness: 300 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10, stiffness: 200 }).start();
  return { scale, onIn, onOut };
}

// ─── PresetBtn ────────────────────────────────
function PresetBtn({
  amount,
  selected,
  onSelect,
  popular,
}: {
  amount: number;
  selected: boolean;
  onSelect: () => void;
  popular?: boolean;
}) {
  const { scale, onIn, onOut } = usePress();
  const bgAnim     = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgAnim,     { toValue: selected ? 1 : 0, duration: Duration.normal, useNativeDriver: false }),
      Animated.timing(borderAnim, { toValue: selected ? 1 : 0, duration: Duration.normal, useNativeDriver: false }),
    ]).start();
  }, [selected]);

  const bg     = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.neutral[0], Colors.primary[500]] });
  const border = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.neutral[200], Colors.primary[500]] });
  const color  = selected ? Colors.neutral[0] : Colors.neutral[700];

  return (
    <Pressable onPress={onSelect} onPressIn={onIn} onPressOut={onOut} style={{ flex: 1 }}>
      {/* Outer: scale — useNativeDriver: true */}
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Inner: color — useNativeDriver: false */}
        <Animated.View
          style={{
            borderWidth: 1.5,
            borderColor: border,
            borderRadius: Radius.lg,
            backgroundColor: bg,
            paddingVertical: Spacing[3],
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            ...(selected ? Shadow.orange : {}),
          }}
        >
          {popular && !selected && (
            <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary[100], paddingHorizontal: 6, paddingVertical: 2, borderBottomLeftRadius: Radius.sm }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: Colors.primary[600] }}>POPULAR</Text>
            </View>
          )}
          <Text style={{ fontSize: 17, fontWeight: '800', color }}>₴{amount}</Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: selected ? 'rgba(255,255,255,0.7)' : Colors.neutral[400], marginTop: 1 }}>
            per {amount <= 100 ? 'coffee' : amount <= 200 ? 'day' : 'month'}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── ModeTab ──────────────────────────────────
function ModeTab({
  label,
  icon,
  active,
  onPress,
  description,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
  description: string;
}) {
  const { scale, onIn, onOut } = usePress();
  const bgAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, { toValue: active ? 1 : 0, duration: Duration.normal, useNativeDriver: false }).start();
  }, [active]);

  const bg = bgAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.neutral[100], Colors.primary[500]] });

  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={{ flex: 1 }}>
      {/* Outer: scale — useNativeDriver: true */}
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Inner: color — useNativeDriver: false */}
        <Animated.View
          style={{
            backgroundColor: bg,
            borderRadius: Radius.md,
            paddingVertical: Spacing[3],
            paddingHorizontal: Spacing[2],
            alignItems: 'center',
            gap: 4,
            ...(active ? Shadow.orange : {}),
          }}
        >
          {icon}
          <Text style={{ fontSize: 13, fontWeight: '700', color: active ? Colors.neutral[0] : Colors.neutral[500] }}>{label}</Text>
          <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.75)' : Colors.neutral[400], textAlign: 'center' }}>{description}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── SuccessView ──────────────────────────────
function SuccessView({ mode, amount, onClose }: { mode: DonationMode; amount: number; onClose: () => void }) {
  const scale      = useRef(new Animated.Value(0.4)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
      Animated.timing(opacity, { toValue: 1, duration: Duration.normal, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start();
    });
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center', paddingVertical: Spacing[8], gap: Spacing[4] }}>
      <Animated.View style={{ transform: [{ scale: checkScale }] }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', ...Shadow.lg }}>
          <CheckCircle size={44} color={Colors.primary[500]} strokeWidth={1.8} />
        </View>
      </Animated.View>
      <View style={{ alignItems: 'center', gap: Spacing[2] }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.neutral[900] }}>
          {mode === 'GUARDIANSHIP' ? "You're a guardian! 🐾" : 'Thank you! ❤️'}
        </Text>
        <Text style={{ fontSize: 14, color: Colors.neutral[500], textAlign: 'center', lineHeight: 21 }}>
          {mode === 'GUARDIANSHIP'
            ? `Your ₴${amount}/month subscription is now active. You'll be notified about updates.`
            : `₴${amount} is on its way. Redirecting to payment...`}
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => ({
          backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
          borderRadius: Radius.lg, height: 52, paddingHorizontal: Spacing[8],
          alignItems: 'center', justifyContent: 'center', marginTop: Spacing[2], ...Shadow.orange,
        })}
      >
        <Text style={{ color: Colors.neutral[0], fontSize: 15, fontWeight: '700' }}>Done</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── DonationSheet ────────────────────────────
export function DonationSheet({
  visible,
  onClose,
  animalId,
  animalName,
  shelterId,
  initialMode = 'ONE_TIME',
}: DonationSheetProps) {
  const insets = useSafeAreaInsets();

  const [mode,        setMode]        = useState<DonationMode>(initialMode);
  const [selectedAmt, setSelectedAmt] = useState<number | null>(100);
  const [customAmt,   setCustomAmt]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  const baseY          = useRef(new Animated.Value(600)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const combinedY      = useRef(Animated.add(baseY, keyboardOffset)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // ── Open / close ──────────────────────────────────────
  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(baseY, { toValue: 0, useNativeDriver: false, damping: 22, stiffness: 200 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: Duration.normal, useNativeDriver: true }),
    ]).start();
  }, [baseY, backdropOpacity]);

  const close = useCallback(() => {
    // 1. Dismiss keyboard and instantly reset its offset
    //    so the sheet starts sliding from its resting position.
    Keyboard.dismiss();
    keyboardOffset.setValue(0);

    // 2. Slide sheet out + fade backdrop
    Animated.parallel([
      Animated.timing(baseY, {
        toValue: 600,
        duration: Duration.slow,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: Duration.normal, useNativeDriver: true }),
    ]).start(() => {
      setSuccess(false);
      setCustomAmt('');
      setSelectedAmt(100);
      setMode(initialMode);
      onClose();
    });
  }, [baseY, keyboardOffset, backdropOpacity, initialMode, onClose]);

  useEffect(() => {
    if (visible) open(); else close();
  }, [visible]);

  // ── Keyboard listeners ────────────────────────────────
  //  iOS:     keyboardWillShow/Hide → animates in sync with system keyboard
  //  Android: keyboardDidShow/Hide  → fires after keyboard is already visible
  //
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    };

    const onHide = (e: KeyboardEvent) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  // Reset amount on mode switch
  useEffect(() => {
    setSelectedAmt(mode === 'ONE_TIME' ? 100 : 200);
    setCustomAmt('');
  }, [mode]);

  const presets     = mode === 'ONE_TIME' ? ONE_TIME_PRESETS : GUARDIANSHIP_PRESETS;
  const finalAmount = customAmt ? parseInt(customAmt, 10) : selectedAmt ?? 0;

  const handleSubmit = async () => {
    if (!finalAmount || finalAmount < 10) {
      Alert.alert('Invalid amount', 'Minimum donation is ₴10');
      return;
    }
    setLoading(true);
    try {
      let paymentUrl: string;
      if (mode === 'ONE_TIME') {
        const res = await donationService.createOneTime({ shelterId, animalId, amount: finalAmount });
        paymentUrl = res.paymentUrl;
      } else {
        const res = await donationService.createGuardianship({ animalId, monthlyAmount: finalAmount });
        paymentUrl = res.paymentUrl;
      }
      setSuccess(true);
      setTimeout(() => {
        close();
        router.push({ pathname: '/(app)/payment-webview', params: { url: paymentUrl } });
      }, 1800);
    } catch (err: any) {
      Alert.alert('Payment error', err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={close} statusBarTranslucent>
      {/* ── Backdrop ─────────────────────────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: Colors.overlay.dark,
          opacity: backdropOpacity,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* ── Sheet ────────────────────────────────────────── */}
      {/* No KeyboardAvoidingView — keyboard handled via listeners above */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          // combinedY = baseY + keyboardOffset
          // baseY: 600 (hidden) → 0 (visible)
          // keyboardOffset: 0 → -keyboardHeight when keyboard shows
          transform: [{ translateY: combinedY }],
          backgroundColor: Colors.neutral[0],
          borderTopLeftRadius: Radius['2xl'],
          borderTopRightRadius: Radius['2xl'],
          paddingBottom: insets.bottom + Spacing[4],
          ...Shadow.md,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: Spacing[3], paddingBottom: Spacing[1] }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.neutral[200] }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: Spacing[6], paddingTop: Spacing[3] }}
        >
          {success ? (
            <SuccessView mode={mode} amount={finalAmount} onClose={close} />
          ) : (
            <>
              {/* ── Header ──────────────────────────────── */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing[5] }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.primary[500], letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Support
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.3 }}>
                    {animalName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Shield size={12} color={Colors.success} strokeWidth={2} />
                    <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                      Secure payment · 100% goes to shelter
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={close}
                  style={({ pressed }) => ({
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
                    alignItems: 'center', justifyContent: 'center',
                  })}
                >
                  <X size={18} color={Colors.neutral[500]} strokeWidth={2} />
                </Pressable>
              </View>

              {/* ── Mode tabs ───────────────────────────── */}
              <View
                style={{
                  flexDirection: 'row', gap: Spacing[2],
                  backgroundColor: Colors.neutral[100],
                  borderRadius: Radius.lg, padding: Spacing[1],
                  marginBottom: Spacing[5],
                }}
              >
                <ModeTab
                  label="One-time" description="Single donation"
                  active={mode === 'ONE_TIME'} onPress={() => setMode('ONE_TIME')}
                  icon={<Zap size={16} color={mode === 'ONE_TIME' ? Colors.neutral[0] : Colors.neutral[400]} strokeWidth={1.8} />}
                />
                <ModeTab
                  label="Monthly" description="Become guardian"
                  active={mode === 'GUARDIANSHIP'} onPress={() => setMode('GUARDIANSHIP')}
                  icon={<Repeat2 size={16} color={mode === 'GUARDIANSHIP' ? Colors.neutral[0] : Colors.neutral[400]} strokeWidth={1.8} />}
                />
              </View>

              {/* ── Guardianship banner ──────────────────── */}
              {mode === 'GUARDIANSHIP' && (
                <View
                  style={{
                    backgroundColor: Colors.primary[50], borderRadius: Radius.md,
                    padding: Spacing[3], flexDirection: 'row', alignItems: 'flex-start',
                    gap: Spacing[2], marginBottom: Spacing[5],
                    borderWidth: 1, borderColor: Colors.primary[100],
                  }}
                >
                  <Sparkles size={16} color={Colors.primary[500]} strokeWidth={1.8} />
                  <Text style={{ flex: 1, fontSize: 13, color: Colors.primary[700], lineHeight: 19 }}>
                    As a virtual guardian you'll get monthly updates about {animalName} and be listed as their sponsor.
                  </Text>
                </View>
              )}

              {/* ── Amount label ─────────────────────────── */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.neutral[500], marginBottom: Spacing[2] }}>
                {mode === 'ONE_TIME' ? 'Choose amount' : 'Monthly amount'}
              </Text>

              {/* ── Presets ──────────────────────────────── */}
              <View style={{ flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] }}>
                {presets.map((amt, i) => (
                  <PresetBtn
                    key={amt} amount={amt} popular={i === 1}
                    selected={selectedAmt === amt && !customAmt}
                    onSelect={() => { setSelectedAmt(amt); setCustomAmt(''); }}
                  />
                ))}
              </View>

              {/* ── Custom input ─────────────────────────── */}
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: customAmt ? Colors.primary[400] : Colors.neutral[200],
                  borderRadius: Radius.lg, paddingHorizontal: Spacing[4],
                  height: 52, marginBottom: Spacing[6],
                  backgroundColor: customAmt ? Colors.primary[50] : Colors.neutral[50],
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.neutral[400], marginRight: Spacing[1] }}>₴</Text>
                <TextInput
                  value={customAmt}
                  onChangeText={(t) => {
                    const digits = t.replace(/[^0-9]/g, '');
                    setCustomAmt(digits);
                    if (digits) setSelectedAmt(null);
                  }}
                  placeholder="Custom amount"
                  placeholderTextColor={Colors.neutral[400]}
                  keyboardType="number-pad"
                  style={{
                    flex: 1, fontSize: 16, fontWeight: '600', color: Colors.neutral[900],
                    ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
                  }}
                />
                {customAmt ? (
                  <Pressable onPress={() => setCustomAmt('')} hitSlop={8}>
                    <X size={16} color={Colors.neutral[400]} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>

              {/* ── Total row ────────────────────────────── */}
              <View
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: Colors.neutral[50], borderRadius: Radius.lg,
                  padding: Spacing[4], marginBottom: Spacing[5],
                  borderWidth: 1, borderColor: Colors.neutral[150],
                }}
              >
                <View>
                  <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                    {mode === 'ONE_TIME' ? 'You donate' : 'Monthly charge'}
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.neutral[900], marginTop: 2 }}>
                    ₴{finalAmount || '—'}
                    {mode === 'GUARDIANSHIP' && finalAmount
                      ? <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.neutral[400] }}>/mo</Text>
                      : null}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Shield size={12} color={Colors.success} strokeWidth={2} />
                    <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '600' }}>Secured</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: Colors.neutral[400] }}>Cancel anytime</Text>
                </View>
              </View>

              {/* ── CTA ──────────────────────────────────── */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading || !finalAmount}
                style={({ pressed }) => ({
                  backgroundColor: !finalAmount ? Colors.neutral[200] : pressed ? Colors.primary[600] : Colors.primary[500],
                  borderRadius: Radius.lg, height: 56,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: Spacing[3],
                  opacity: loading ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  ...(!finalAmount ? {} : Shadow.orange),
                })}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.neutral[0]} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                    <Heart size={18} color={Colors.neutral[0]} fill={Colors.neutral[0]} strokeWidth={0} />
                    <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
                      {mode === 'ONE_TIME'
                        ? `Donate ₴${finalAmount || '—'}`
                        : `Subscribe ₴${finalAmount || '—'}/mo`}
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Disclaimer */}
              <Text style={{ fontSize: 11, color: Colors.neutral[400], textAlign: 'center', lineHeight: 16, marginBottom: Spacing[2] }}>
                By tapping you agree to our{' '}
                <Text style={{ color: Colors.primary[500] }}>Terms of Service</Text>.
                {mode === 'GUARDIANSHIP' ? ' You can cancel your subscription at any time.' : ''}
              </Text>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}