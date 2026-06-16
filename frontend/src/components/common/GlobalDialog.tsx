import { AlertCircle, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '@/lib/theme';
import { useDialogStore } from '@/store/dialog';

/**
 * A globally accessible dialog component controlled by `useDialogStore`.
 * Supports rendering alert (single action) or confirmation (two actions) dialogs,
 * including destructive styles, with smooth entering/exiting animations.
 */
export function GlobalDialog() {
  const { current, closeDialog } = useDialogStore();

  const [data, setData] = useState(current);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sync internal state when a new dialog config is provided via the store.
    if (current) {
      setData(current);
      setIsVisible(true);
    } else if (isVisible) {
      // Delay unmounting to allow the exit animation (FadeOut) to complete.
      const timer = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(timer);
    }
  }, [current, isVisible]);

  if (!isVisible || !data) return null;

  const isAlert = data.type === 'alert';
  const isDestructive = data.isDestructive ?? false;

  const Icon = isAlert || isDestructive ? AlertCircle : Info;
  const iconColor = isAlert || isDestructive ? Colors.error : Colors.primary[500];
  const iconBg = isAlert || isDestructive ? '#FEE2E2' : Colors.primary[50];

  const confirmBg = isAlert || isDestructive ? Colors.error : Colors.primary[500];

  return (
    <Modal transparent visible={isVisible} animationType="none">
      {!!current && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDialog(false)} />

          <Animated.View
            entering={ZoomIn.duration(250).springify().damping(18)}
            style={styles.card}
          >
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Icon size={24} color={iconColor} strokeWidth={2} />
            </View>

            <Text style={styles.title}>{data.title}</Text>
            {!!data.message && <Text style={styles.message}>{data.message}</Text>}

            <View style={styles.buttonRow}>
              {!isAlert && (
                <Pressable
                  onPress={() => closeDialog(false)}
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancelButton,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.cancelText}>{data.cancelText ?? 'Cancel'}</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => closeDialog(true)}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: confirmBg },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.okText}>{data.confirmText ?? 'OK'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[5],
  },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Shadow.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.neutral[900],
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing[6],
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.neutral[100],
  },
  cancelText: {
    color: Colors.neutral[600],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  okText: {
    color: Colors.neutral[0],
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
