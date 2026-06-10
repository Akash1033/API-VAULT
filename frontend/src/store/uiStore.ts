// Path: src/store/uiStore.ts
// Purpose: Global UI state management for active sections
// Dependencies: zustand

import { create } from 'zustand';

interface ToastOptions {
  message: string;
  type: 'success' | 'error';
}

interface UiState {
  activeSection: string;
  setActiveSection: (id: string) => void;
  openSupportForm: boolean;
  setOpenSupportForm: (v: boolean) => void;
  toast: ToastOptions | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  activeSection: 'home',
  setActiveSection: (id) => set({ activeSection: id }),
  openSupportForm: false,
  setOpenSupportForm: (v) => set({ openSupportForm: v }),
  toast: null,
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set((state) => {
        if (state.toast?.message === message) {
          return { toast: null };
        }
        return state;
      });
    }, 3000);
  },
  hideToast: () => set({ toast: null }),
}));

export const useToast = () => {
  const showToast = useUiStore(state => state.showToast);
  return { showToast };
};
