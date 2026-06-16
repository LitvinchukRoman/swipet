import { create } from 'zustand';

/**
 * Zustand store for managing the state of the GlobalDialog component.
 */
export type DialogType = 'alert' | 'confirm';

export interface DialogOptions {
  title: string;
  message?: string;
  type: DialogType;
  resolve: (value: boolean) => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface DialogState {
  current: DialogOptions | null;
  showDialog: (options: Omit<DialogOptions, 'resolve'>) => Promise<boolean>;
  closeDialog: (result: boolean) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  current: null,

  showDialog: (options) => {
    return new Promise((resolve) => {
      set({ current: { ...options, resolve } });
    });
  },

  closeDialog: (result) => {
    set((state) => {
      if (state.current) {
        state.current.resolve(result);
      }
      return { current: null };
    });
  },
}));
