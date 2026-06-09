import { Alert, Platform } from 'react-native';

/**
 * Cross-platform сповіщення.
 * ⚠️ Alert.alert на react-native-web — no-op (нічого не показує), тож на web
 * використовуємо нативний window.alert. На iOS/Android — звичайний Alert.
 */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform підтвердження (так/ні). Повертає Promise<boolean>.
 * Web → window.confirm; native → Alert з двома кнопками.
 */
export function confirm(title: string, message?: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Скасувати', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
