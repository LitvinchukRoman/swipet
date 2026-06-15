import { useDialogStore } from '@/store/dialog';

/**
 * Cross-platform сповіщення.
 * Тепер використовує кастомний Zustand-модал.
 */
export function notify(title: string, message?: string): void {
  useDialogStore.getState().showDialog({
    type: 'alert',
    title,
    message,
    isDestructive: false,
  });
}

/**
 * Cross-platform підтвердження (так/ні). Повертає Promise<boolean>.
 * Тепер використовує кастомний Zustand-модал.
 */
export function confirm(title: string, message?: string, isDestructive: boolean = true): Promise<boolean> {
  return useDialogStore.getState().showDialog({
    type: 'confirm',
    title,
    message,
    isDestructive,
    cancelText: 'Cancel',
    confirmText: 'OK',
  });
}
