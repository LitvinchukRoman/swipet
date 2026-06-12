import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ORANGE_500 = '#F97316';
const ORANGE_50 = '#FFF7ED';
const STONE_400 = '#A8A29E';
const WHITE = '#FFFFFF';
const SHADOW_COLOR = '#1C1917';

// ─── Tab config ───────────────────────────────────────────────────────────────
export type TabConfig = {
  name: string;
  label: string;
  Icon: React.FC<{ size: number; color: string; strokeWidth: number }>;
};

// ─── Individual animated tab item ────────────────────────────────────────────
type TabItemProps = {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({ tab, isFocused, onPress, onLongPress }: TabItemProps) {
  const { Icon, label } = tab;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  const springCfg = { useNativeDriver: true, tension: 340, friction: 18 };

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: -6, ...springCfg }),
        Animated.spring(bounceAnim, { toValue: 0, ...springCfg }),
      ]).start();
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.22, ...springCfg }),
        Animated.spring(scaleAnim, { toValue: 1.0, ...springCfg }),
      ]).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.spring(labelAnim, { toValue: 1, tension: 280, friction: 22, useNativeDriver: true }).start();
      Animated.timing(dotAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(glowAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      Animated.timing(labelAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start();
      Animated.timing(dotAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      Animated.spring(scaleAnim, { toValue: 1, ...springCfg }).start();
    }
  }, [isFocused]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 20 }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 400, friction: 20 }).start();
  }, []);

  const iconColor = isFocused ? ORANGE_500 : STONE_400;
  const iconStroke = isFocused ? 2.2 : 1.6;

  const labelTranslate = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });
  const pillScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: ORANGE_50,
          opacity: glowAnim,
          transform: [{ scale: pillScale }],
          shadowColor: ORANGE_500,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
          elevation: 6,
        }}
      />

      <Animated.View
        style={{
          alignItems: 'center',
          transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
        }}
      >
        <Icon size={22} color={iconColor} strokeWidth={iconStroke} />
        <Animated.Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.2,
            marginTop: 3,
            color: isFocused ? ORANGE_500 : STONE_400,
            opacity: isFocused ? labelAnim : 1,
            transform: [{ translateY: labelTranslate }],
          }}
        >
          {label}
        </Animated.Text>
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: -6,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: ORANGE_500,
          opacity: dotAnim,
          transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }],
        }}
      />
    </Pressable>
  );
}

// ─── Custom floating tab bar ──────────────────────────────────────────────────
// Shared between the adopter (app) shell and the shelter-admin (shelter) shell.
// Pass the per-shell `tabs` config; visuals stay identical.
export function FloatingTabBar({
  state,
  navigation,
  tabs,
}: BottomTabBarProps & { tabs: TabConfig[] }) {
  const insets = useSafeAreaInsets();

  const entranceAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entranceAnim, { toValue: 0, useNativeDriver: true, tension: 260, friction: 22 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 12,
        left: 20,
        right: 20,
        transform: [{ translateY: entranceAnim }],
        opacity: opacityAnim,
        backgroundColor: WHITE,
        borderRadius: 32,
        height: 72,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        ...Platform.select({
          ios: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.16,
            shadowRadius: 32,
          },
          android: { elevation: 16 },
        }),
        borderWidth: 1,
        borderColor: 'rgba(214, 211, 208, 0.5)',
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tabConfig = tabs.find((t) => t.name === route.name);
        if (!tabConfig) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            tab={tabConfig}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </Animated.View>
  );
}
