import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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
  Animated,
  Dimensions,
  Keyboard,
  type KeyboardEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Duration, Radius, Shadow, Spacing } from '@/lib/theme';
import { notify } from '@/lib/notify';
import { donationService } from '@/services/donation';

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
const SCREEN_H = Dimensions.get('window').height;
const ONE_TIME_PRESETS     = [50, 100, 200];
const GUARDIANSHIP_PRESETS = [100, 200, 500];
// Мінімуми мають збігатися з бекендом: одноразовий ₴10, опікунство ₴50/міс.
const MIN_ONE_TIME      = 10;
const MIN_GUARDIANSHIP  = 50;

// ─── Spring press hook (untouched) ────────────
function usePress() {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, damping: 12, stiffness: 300 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 10, stiffness: 200 }).start();
  return { scale, onIn, onOut };
}

// ─── PresetBtn (untouched) ────────────────────
function PresetBtn({ 
  amount, 
  selected, 
  onSelect, 
  popular,
  mode
}: { 
  amount: number; 
  selected: boolean; 
  onSelect: () => void;
  popular?: boolean;
  mode: 'ONE_TIME' | 'GUARDIANSHIP';
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
      <Animated.View style={{ transform: [{ scale }] }}>
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
            {mode === 'ONE_TIME' 
              ? (amount <= 50 ? 'for a treat' : amount <= 100 ? 'for a toy' : 'for food')
              : (amount <= 100 ? 'Furry Friend' : amount <= 200 ? 'Fluffy Sponsor' : 'Zoo Tycoon')}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── ModeTab (untouched) ──────────────────────
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
      <Animated.View style={{ transform: [{ scale }] }}>
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

// ─── SuccessView (untouched) ──────────────────
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
          One last step 🐾
        </Text>
        <Text style={{ fontSize: 14, color: Colors.neutral[500], textAlign: 'center', lineHeight: 21 }}>
          {mode === 'GUARDIANSHIP'
            ? `Opening secure payment — complete the ₴${amount}/month checkout to start your guardianship.`
            : `Opening secure payment — complete the ₴${amount} checkout to finish your donation.`}
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

  // Відкладене відкриття платіжного браузера — тримаємо в ref, щоб скасувати,
  // якщо користувач закрив sheet до спрацювання (інакше браузер відкриється «привидом»).
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reanimated State (Замінив Animated на Reanimated для жестів) ──
  const [isMounted, setIsMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_H);
  const keyboardOffset = useSharedValue(0);
  const backdropOp = useSharedValue(0);

  const close = useCallback(() => {
    // Скасовуємо заплановане відкриття платіжного браузера при ручному закритті.
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    Keyboard.dismiss();
    keyboardOffset.value = withTiming(0);
    translateY.value = withTiming(SCREEN_H, { duration: 250 });
    backdropOp.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setIsMounted)(false);
        runOnJS(setSuccess)(false);
        runOnJS(setCustomAmt)('');
        runOnJS(setSelectedAmt)(100);
        runOnJS(setMode)(initialMode);
        runOnJS(onClose)();
      }
    });
  }, [initialMode, onClose]);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      backdropOp.value = withTiming(1, { duration: 250 });
    } else if (isMounted) {
      close();
    }
  }, [visible]);

  // ── Keyboard listeners ────────────────────────────────
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      keyboardOffset.value = withTiming(-e.endCoordinates.height, { duration: Platform.OS === 'ios' ? e.duration : 200 });
    };
    const onHide = (e: KeyboardEvent) => {
      keyboardOffset.value = withTiming(0, { duration: Platform.OS === 'ios' ? e.duration : 200 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => { showSub.remove(); hideSub.remove(); };
  }, [keyboardOffset]);

  // Підстраховка: чистимо відкладений таймер при розмонтуванні.
  useEffect(() => () => {
    if (openTimer.current) clearTimeout(openTimer.current);
  }, []);

  // ── Жест свайпу вниз ──────────────────────────────────
  const pan = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 500) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
      }
    });

  const animSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + keyboardOffset.value }],
  }));

  const animBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  // Reset amount on mode switch
  useEffect(() => {
    setSelectedAmt(mode === 'ONE_TIME' ? 100 : 200);
    setCustomAmt('');
  }, [mode]);

  const presets     = mode === 'ONE_TIME' ? ONE_TIME_PRESETS : GUARDIANSHIP_PRESETS;
  const parsedCustom = customAmt ? parseInt(customAmt, 10) : null;
  const finalAmount  = parsedCustom != null && !Number.isNaN(parsedCustom) ? parsedCustom : selectedAmt ?? 0;
  const minAmount    = mode === 'GUARDIANSHIP' ? MIN_GUARDIANSHIP : MIN_ONE_TIME;

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!finalAmount || finalAmount < minAmount) {
      notify(
        'Invalid amount',
        mode === 'GUARDIANSHIP'
          ? `Minimum monthly guardianship is ₴${MIN_GUARDIANSHIP}`
          : `Minimum donation is ₴${MIN_ONE_TIME}`,
      );
      return;
    }
    setLoading(true);
    try {
      let paymentUrl: string;
      if (mode === 'ONE_TIME') {
        // shelterId може бути 0/undefined (напр. зі списку «Улюблені») — тоді не шлемо його,
        // бекенд резолвить притулок із animalId. Це прибирає поломку разового донату.
        const res = await donationService.createOneTime({
          shelterId: shelterId || undefined,
          animalId,
          amount: finalAmount,
        });
        paymentUrl = res.paymentUrl;
      } else {
        const res = await donationService.createGuardianship({ animalId, monthlyAmount: finalAmount });
        paymentUrl = res.paymentUrl;
      }

      setSuccess(true);

      openTimer.current = setTimeout(async () => {
        openTimer.current = null;
        close();
        // Web: Stripe redirect веде на той самий https-origin → app сам верифікує сесію.
        // Native: in-app browser; повноцінний deep-link verify — окремий тікет.
        await WebBrowser.openBrowserAsync(paymentUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          showTitle: false,
          enableBarCollapsing: true,
        });
      }, 1600);

    } catch (err: any) {
      notify('Payment error', err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <Modal transparent animationType="none" visible={isMounted} onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* ── Backdrop ─────────────────────────────────────── */}
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: Colors.overlay.dark },
            animBackdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Reanimated.View>

        {/* ── Sheet ────────────────────────────────────────── */}
        <Reanimated.View
          style={[
            {
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: Radius['2xl'],
              borderTopRightRadius: Radius['2xl'],
              paddingBottom: insets.bottom + Spacing[4],
              maxHeight: SCREEN_H * 0.95,
              ...Shadow.md,
            },
            animSheetStyle,
          ]}
        >
          {/* Обгортаємо смужку в GestureDetector для свайпу */}
          <GestureDetector gesture={pan}>
            <View style={{ alignItems: 'center', paddingTop: Spacing[3], paddingBottom: Spacing[4], backgroundColor: 'transparent' }}>
              <View style={{ width: 40, height: 5, borderRadius: 2.5, backgroundColor: Colors.neutral[200] }} />
            </View>
          </GestureDetector>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Spacing[6], paddingTop: Spacing[1] }}
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
                      mode={mode}
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
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit}
                  disabled={loading || !finalAmount}
                  style={[
                    {
                      borderRadius: Radius.lg,
                      height: 56,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: Spacing[3],
                    },
                    // Динамічно міняємо колір і додаємо тінь тільки якщо є сума
                    !finalAmount 
                      ? { backgroundColor: Colors.neutral[200] } 
                      : { backgroundColor: Colors.primary[500], ...Shadow.orange },
                    // Якщо йде завантаження — робимо кнопку трохи прозорою
                    loading && { opacity: 0.75 }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.neutral[0]} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                      <Heart size={18} color={Colors.neutral[0]} fill={Colors.neutral[0]} />
                      <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700' }}>
                        {mode === 'ONE_TIME'
                          ? `Donate ₴${finalAmount || '—'}`
                          : `Subscribe ₴${finalAmount || '—'}/mo`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={{ fontSize: 11, color: Colors.neutral[400], textAlign: 'center', lineHeight: 16, marginBottom: Spacing[2] }}>
                  By tapping you agree to our{' '}
                  <Text style={{ color: Colors.primary[500] }}>Terms of Service</Text>.
                  {mode === 'GUARDIANSHIP' ? ' You can cancel your subscription at any time.' : ''}
                </Text>
              </>
            )}
          </ScrollView>
        </Reanimated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}