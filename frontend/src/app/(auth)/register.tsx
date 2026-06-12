import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User, PawPrint, CheckCircle, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';
import { Colors, Duration, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { analyzePassword, validatePassword, type Strength } from '@/lib/password';

// ─── Password strength ───────────────────────────────────────────────────────
const STRENGTH_CFG: Record<Strength, { label: string; color: string; width: number }> = {
  empty:  { label: '',        color: Colors.neutral[200],    width: 0    },
  weak:   { label: 'Weak',   color: Colors.strength.weak,   width: 0.2  },
  fair:   { label: 'Fair',   color: Colors.strength.fair,   width: 0.5  },
  good:   { label: 'Good',   color: Colors.strength.good,   width: 0.75 },
  strong: { label: 'Strong', color: Colors.strength.strong, width: 1    },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const { strength, hint } = analyzePassword(password);
  const cfg = STRENGTH_CFG[strength];

  const progress  = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const strengthIndex = { empty: 0, weak: 1, fair: 2, good: 3, strong: 4 }[strength];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(progress, { toValue: cfg.width, useNativeDriver: false, damping: 18, stiffness: 120 }),
      Animated.timing(colorAnim, { toValue: strengthIndex, duration: Duration.normal, useNativeDriver: false, easing: Easing.out(Easing.quad) }),
    ]).start();
  }, [strength]);

  const animColor = colorAnim.interpolate({
    inputRange:  [0, 1, 2, 3, 4],
    outputRange: [Colors.neutral[200], Colors.strength.weak, Colors.strength.fair, Colors.strength.good, Colors.strength.strong],
  });

  if (!password) return null;

  return (
    <View style={{ marginTop: Spacing[2], gap: Spacing[1] }}>
      <View style={{ height: 5, borderRadius: Radius.full, backgroundColor: Colors.neutral[100], overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: Radius.full,
            backgroundColor: animColor,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Animated.Text style={{ fontSize: 11, fontWeight: '700', color: animColor }}>
          {cfg.label}
        </Animated.Text>
        {hint ? (
          <Text style={{ fontSize: 11, color: Colors.neutral[400] }}>{hint}</Text>
        ) : strength === 'strong' ? (
          <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.strength.strong }}>✓ Great password</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── useShake ────────────────────────────────────────────────────────────────
const useShake = () => {
  const x = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(x, { toValue: -10, duration: Duration.instant, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(x, { toValue:  10, duration: Duration.instant, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(x, { toValue:  -7, duration: Duration.instant, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(x, { toValue:   7, duration: Duration.instant, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(x, { toValue:   0, duration: Duration.instant, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  }, [x]);
  return { shakeStyle: { transform: [{ translateX: x }] }, shake };
};

// ─── useFadeSlide ────────────────────────────────────────────────────────────
const useFadeSlide = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: Duration.slow, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration: Duration.slow, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─── FloatingInput ───────────────────────────────────────────────────────────
function FloatingInput({
  label,
  error,
  icon,
  secureToggle,
  showSecure,
  onToggleSecure,
  value,
  matchOk,
  ...props
}: {
  label: string;
  error?: string;
  icon: React.ReactNode;
  secureToggle?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  value: string;
  matchOk?: boolean | null;
} & Omit<React.ComponentProps<typeof TextInput>, 'style'>) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelAnim  = useRef(new Animated.Value(value ? 1 : 0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: Duration.normal, useNativeDriver: false }).start();
    Animated.timing(labelAnim,  { toValue: 1, duration: Duration.normal, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: Duration.normal, useNativeDriver: false }).start();
    if (!value) Animated.timing(labelAnim, { toValue: 0, duration: Duration.normal, useNativeDriver: false }).start();
  };

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: (value || focused) ? 1 : 0,
      duration: Duration.fast,
      useNativeDriver: false,
    }).start();
  }, [value, focused]);

  const animBorder = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [error ? Colors.error : Colors.neutral[200], Colors.primary[500]] });
  const labelTop   = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 6] });
  const labelSize  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.neutral[400], error ? Colors.error : Colors.primary[500]] });

  return (
    <View>
      <Animated.View
        style={{
          borderWidth: 1.5,
          borderColor: error ? Colors.error : animBorder,
          borderRadius: Radius.lg,
          backgroundColor: focused ? Colors.neutral[0] : Colors.neutral[50],
          height: Layout.inputHeight + 4,
        }}
      >
        <Animated.Text
          style={{
            position: 'absolute', left: 48, top: labelTop,
            fontSize: labelSize, color: labelColor, fontWeight: '500',
            ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
          }}
        >
          {label}
        </Animated.Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', height: '100%', paddingHorizontal: Spacing[4] }}>
          <View style={{ marginRight: Spacing[3], opacity: focused || value ? 1 : 0.4 }}>
            {icon}
          </View>
          <TextInput
            {...props}
            value={value}
            onFocus={onFocus}
            onBlur={onBlur}
            secureTextEntry={secureToggle && !showSecure}
            placeholderTextColor="transparent"
            style={{
              flex: 1, fontSize: 15, color: Colors.neutral[900],
              paddingTop: 18, paddingBottom: 4,
              ...(Platform.OS === 'web'
                ? ({ outline: 'none', outlineWidth: 0, boxShadow: 'none', backgroundColor: 'transparent' } as any)
                : {}),
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
            {matchOk !== null && matchOk !== undefined && value.length > 0 && (
              matchOk
                ? <CheckCircle size={18} color={Colors.success} strokeWidth={2} />
                : <XCircle     size={18} color={Colors.error}   strokeWidth={2} />
            )}
            {secureToggle && (
              <Pressable onPress={onToggleSecure} hitSlop={12}>
                {showSecure
                  ? <EyeOff size={18} color={Colors.neutral[400]} strokeWidth={1.8} />
                  : <Eye    size={18} color={Colors.neutral[400]} strokeWidth={1.8} />
                }
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
      {error ? (
        <Text style={{ fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: Spacing[2] }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ─── RegisterScreen ──────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { setAuth } = useAuthStore();

  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [agreed,     setAgreed]     = useState(false);

  const { shakeStyle, shake } = useShake();

  const anim0 = useFadeSlide(0);
  const anim1 = useFadeSlide(80);
  const anim2 = useFadeSlide(160);
  const anim3 = useFadeSlide(240);

  const clearErr = (key: string) =>
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim())                        e.fullName   = 'Full name is required';
    if (!email.trim())                           e.email      = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email      = 'Enter a valid email';
    const pwError = validatePassword(password);
    if (pwError)                                 e.password   = pwError;
    if (password !== confirmPwd)                 e.confirmPwd = 'Passwords do not match';
    if (!agreed)                                 e.agreed     = 'Please accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      // 1. Реєстрація
      await authService.register({ fullName: fullName.trim(), email: email.trim(), password });

      // 2. Auto-login — бекенд не повертає токени при register,
      //    тому одразу логінимося з тими самими кредами
      const data = await authService.login({ email: email.trim(), password });
      await setAuth(data.user, data.accessToken, data.refreshToken);

      // 3. Прямий redirect на feed — без проміжних екранів
      router.replace('/(app)/(tabs)');
    } catch (err: any) {
      // Інлайн-помилка під email — Alert на web не завжди показується
      const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.';
      setErrors({ email: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  const pwMatch = confirmPwd.length > 0 ? password === confirmPwd : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingVertical: Spacing[8],
            paddingHorizontal: Spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: Layout.maxContentWidth }}>

            {/* ── Back ───────────────────────────────────── */}
            <Animated.View style={[{ marginBottom: Spacing[4] }, anim0]}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={({ pressed }) => ({
                  width: 40, height: 40, borderRadius: Radius.sm,
                  backgroundColor: pressed ? Colors.neutral[100] : Colors.neutral[50],
                  alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'flex-start',
                })}
              >
                <ArrowLeft size={20} color={Colors.neutral[600]} strokeWidth={1.8} />
              </Pressable>
            </Animated.View>

            {/* ── Header ─────────────────────────────────── */}
            <Animated.View style={[{ marginBottom: Spacing[8] }, anim0]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[2] }}>
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: Colors.primary[50],
                    alignItems: 'center', justifyContent: 'center',
                    ...Shadow.sm,
                  }}
                >
                  <PawPrint size={24} color={Colors.primary[500]} strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.neutral[900], letterSpacing: -0.5 }}>
                  Create account
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: Colors.neutral[400], lineHeight: 20 }}>
                Join Swipet and help animals find their forever home
              </Text>
            </Animated.View>

            {/* ── Form ───────────────────────────────────── */}
            <Animated.View style={[{ gap: Spacing[4] }, anim1, shakeStyle]}>
              <FloatingInput
                label="Full name"
                value={fullName}
                onChangeText={t => { setFullName(t); clearErr('fullName'); }}
                autoCapitalize="words"
                autoComplete="name"
                error={errors.fullName}
                icon={<User size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
              />
              <FloatingInput
                label="Email address"
                value={email}
                onChangeText={t => { setEmail(t); clearErr('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon={<Mail size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
              />
              <View style={{ gap: Spacing[1] }}>
                <FloatingInput
                  label="Password"
                  value={password}
                  onChangeText={t => { setPassword(t); clearErr('password'); }}
                  autoComplete="new-password"
                  error={errors.password}
                  secureToggle
                  showSecure={showPwd}
                  onToggleSecure={() => setShowPwd(v => !v)}
                  icon={<Lock size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
                />
                <PasswordStrengthBar password={password} />
              </View>
              <FloatingInput
                label="Confirm password"
                value={confirmPwd}
                onChangeText={t => { setConfirmPwd(t); clearErr('confirmPwd'); }}
                autoComplete="new-password"
                error={errors.confirmPwd}
                secureToggle
                showSecure={showCfm}
                onToggleSecure={() => setShowCfm(v => !v)}
                matchOk={pwMatch}
                icon={<Lock size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
              />
            </Animated.View>

            {/* ── Terms ──────────────────────────────────── */}
            <Animated.View style={[{ marginTop: Spacing[5] }, anim2]}>
              <Pressable
                onPress={() => { setAgreed(v => !v); clearErr('agreed'); }}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] }}
              >
                <View
                  style={{
                    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
                    borderColor: errors.agreed ? Colors.error : agreed ? Colors.primary[500] : Colors.neutral[300],
                    backgroundColor: agreed ? Colors.primary[500] : Colors.neutral[0],
                    alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}
                >
                  {agreed && (
                    <Text style={{ color: Colors.neutral[0], fontSize: 11, fontWeight: '700' }}>✓</Text>
                  )}
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: Colors.neutral[500], lineHeight: 20 }}>
                  I agree to the{' '}
                  <Text style={{ color: Colors.primary[500], fontWeight: '600' }}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={{ color: Colors.primary[500], fontWeight: '600' }}>Privacy Policy</Text>
                </Text>
              </Pressable>
              {errors.agreed && (
                <Text style={{ fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: Spacing[8] }}>
                  {errors.agreed}
                </Text>
              )}
            </Animated.View>

            {/* ── CTA ────────────────────────────────────── */}
            <Animated.View style={[{ marginTop: Spacing[6] }, anim3]}>
              <Pressable onPress={handleRegister} disabled={loading}>
                {({ pressed }) => (
                  <View
                    style={{
                      ...Shadow.orange,
                      backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
                      borderRadius: Radius.lg,
                      height: Layout.buttonHeight,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: loading ? 0.75 : 1,
                      shadowOpacity: pressed ? 0.15 : 0.30,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.neutral[0]} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                        <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
                          Create Account
                        </Text>
                        <Text style={{ color: Colors.neutral[0], opacity: 0.8, fontSize: 16 }}>→</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* ── Footer ─────────────────────────────────── */}
            <Animated.View style={[{ alignItems: 'center', marginTop: Spacing[7] }, anim3]}>
              <Pressable onPress={() => router.replace('/(auth)/login')}>
                <Text style={{ fontSize: 14, color: Colors.neutral[500] }}>
                  Already have an account?{' '}
                  <Text style={{ color: Colors.primary[500], fontWeight: '700' }}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}