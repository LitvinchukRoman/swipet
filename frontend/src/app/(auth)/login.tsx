import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, PawPrint } from 'lucide-react-native';
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

import { homePathForRole } from '@/lib/roles';
import { Colors, Duration, Layout, Radius, Shadow, Spacing } from '@/lib/theme';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/auth';

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

// ─── useFadeSlide — entrance animation ──────────────────────────────────────
const useFadeSlide = (delay = 0) => {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: Duration.slow,  delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration: Duration.slow,  delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─── Floating label input ────────────────────────────────────────────────────
function FloatingInput({
  label,
  error,
  icon,
  secureToggle,
  showSecure,
  onToggleSecure,
  value,
  ...props
}: {
  label: string;
  error?: string;
  icon: React.ReactNode;
  secureToggle?: boolean;
  showSecure?: boolean;
  onToggleSecure?: () => void;
  value: string;
} & Omit<React.ComponentProps<typeof TextInput>, 'style'>) {
  const [focused, setFocused] = useState(false);
  const borderAnim   = useRef(new Animated.Value(0)).current;
  const labelAnim    = useRef(new Animated.Value(value ? 1 : 0)).current;

  // border color animate
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

  // keep label up when value exists
  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: (value || focused) ? 1 : 0,
      duration: Duration.fast,
      useNativeDriver: false,
    }).start();
  }, [value, focused]);

  const animBorder = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [error ? Colors.error : Colors.neutral[200], Colors.primary[500]],
  });
  const labelTop   = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 6] });
  const labelSize  = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [Colors.neutral[400], error ? Colors.error : Colors.primary[500]],
  });

  return (
    <View>
      <Animated.View
        style={{
          borderWidth: 1.5,
          borderColor: error ? Colors.error : animBorder,
          borderRadius: Radius.lg,
          backgroundColor: focused ? Colors.neutral[0] : Colors.neutral[50],
          height: Layout.inputHeight + 4,
          position: 'relative',
        }}
      >
        {/* floating label */}
        <Animated.Text
          style={{
            position: 'absolute',
            left: 48,
            top: labelTop,
            fontSize: labelSize,
            color: labelColor,
            fontWeight: '500',
            // kill browser outline on web
            ...(Platform.OS === 'web' ? { pointerEvents: 'none' } : {}),
          }}
        >
          {label}
        </Animated.Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', height: '100%', paddingHorizontal: Spacing[4] }}>
          {/* left icon */}
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
              flex: 1,
              fontSize: 15,
              color: Colors.neutral[900],
              paddingTop: 18,
              paddingBottom: 4,
              // kill browser default outline & background
              ...(Platform.OS === 'web'
                ? ({ outline: 'none', outlineWidth: 0, boxShadow: 'none', backgroundColor: 'transparent' } as any)
                : {}),
            }}
          />

          {/* eye toggle */}
          {secureToggle && (
            <Pressable onPress={onToggleSecure} hitSlop={12} style={{ marginLeft: Spacing[2] }}>
              {showSecure
                ? <EyeOff size={18} color={Colors.neutral[400]} strokeWidth={1.8} />
                : <Eye    size={18} color={Colors.neutral[400]} strokeWidth={1.8} />
              }
            </Pressable>
          )}
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

// ─── Paw logo with pulse ring ────────────────────────────────────────────────
function PawLogo() {
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse,        { toValue: 1.35, duration: 1400, useNativeDriver: true, easing: Easing.out(Easing.sin) }),
          Animated.timing(pulse,        { toValue: 1,    duration: 1400, useNativeDriver: true, easing: Easing.in(Easing.sin) }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0,    duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6,  duration: 1400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 96, height: 96 }}>
      {/* pulse ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 96, height: 96,
          borderRadius: 48,
          borderWidth: 2,
          borderColor: Colors.primary[400],
          opacity: pulseOpacity,
          transform: [{ scale: pulse }],
        }}
      />
      {/* badge */}
      <View
        style={{
          width: 80, height: 80,
          borderRadius: 24,
          backgroundColor: Colors.primary[50],
          alignItems: 'center', justifyContent: 'center',
          ...Shadow.orange,
        }}
      >
        <PawPrint size={40} color={Colors.primary[500]} strokeWidth={2.5} />
      </View>
    </View>
  );
}

// ─── LoginScreen ─────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});

  const { setAuth } = useAuthStore();
  const { shakeStyle, shake } = useShake();

  const anim0 = useFadeSlide(0);
  const anim1 = useFadeSlide(100);
  const anim2 = useFadeSlide(200);
  const anim3 = useFadeSlide(300);


  // ── Validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())                             e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email.trim()))   e.email    = 'Enter a valid email';
    if (!password.trim())                          e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      const data = await authService.login({ email: email.trim(), password });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace(homePathForRole(data.user.role));
    } catch (err: any) {
      // Інлайн-помилка під полем пароля (Alert на react-native-web не показується).
      const msg = err?.response?.data?.message ?? 'Invalid email or password';
      setErrors({ password: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

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
            alignItems: 'center',           // ← центрує по горизонталі на веб
            justifyContent: 'center',
            paddingVertical: Spacing[10],
            paddingHorizontal: Spacing[6],
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* max-width обгортка для веб */}
          <View style={{ width: '100%', maxWidth: Layout.maxContentWidth }}>

            {/* ── Logo ─────────────────────────────────── */}
            <Animated.View style={[{ alignItems: 'center', marginBottom: Spacing[8] }, anim0]}>
              <PawLogo />
              <Text
                style={{
                  fontSize: 34,
                  fontWeight: '800',
                  color: Colors.neutral[900],
                  letterSpacing: -0.8,
                  marginTop: Spacing[5],
                }}
              >
                Swipet
              </Text>
              <Text style={{ fontSize: 15, color: Colors.neutral[400], marginTop: Spacing[1] }}>
                Sign in to find your new companion
              </Text>
            </Animated.View>

            {/* ── Form ─────────────────────────────────── */}
            <Animated.View style={[{ gap: Spacing[4] }, anim1, shakeStyle]}>
              <FloatingInput
                label="Email address"
                value={email}
                onChangeText={t => { setEmail(t); setErrors(p => ({ ...p, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon={<Mail size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
              />

              <FloatingInput
                label="Password"
                value={password}
                onChangeText={t => { setPassword(t); setErrors(p => ({ ...p, password: undefined })); }}
                autoComplete="password"
                error={errors.password}
                secureToggle
                showSecure={showPwd}
                onToggleSecure={() => setShowPwd(v => !v)}
                icon={<Lock size={18} color={Colors.primary[500]} strokeWidth={1.8} />}
              />
            </Animated.View>

            {/* ── CTA ──────────────────────────────────── */}
            <Animated.View style={[{ marginTop: Spacing[5], width: '100%' }, anim2]}>
              <Pressable
                onPress={handleLogin}
                disabled={loading}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      ...Shadow.orange,
                      backgroundColor: pressed ? Colors.primary[600] : Colors.primary[500],
                      borderRadius: Radius.lg,
                      height: Layout.buttonHeight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: loading ? 0.75 : 1,
                      shadowOpacity: pressed ? 0.15 : 0.32,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.neutral[0]} />
                    ) : (
                      <Text style={{ color: Colors.neutral[0], fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
                        Sign In
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            </Animated.View>


            {/* ── Footer ───────────────────────────────── */}
            <Animated.View style={[{ alignItems: 'center', marginTop: Spacing[8] }, anim3]}>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={{ fontSize: 14, color: Colors.neutral[500] }}>
                  Don't have an account?{' '}
                  <Text style={{ color: Colors.primary[500], fontWeight: '700' }}>Create one</Text>
                </Text>
              </Pressable>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}