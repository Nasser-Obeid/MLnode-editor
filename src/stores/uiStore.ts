/** UI store — selection, toast messages, panels. */

import { create } from 'zustand';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface UIState {
  selectedNodeId: string | null;
  showImportDialog: boolean;
  toasts: Toast[];
  // Actions
  selectNode: (id: string | null) => void;
  setImportDialog: (show: boolean) => void;
  addToast: (message: string, type?: 'info' | 'error' | 'success') => void;
  removeToast: (id: number) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  selectedNodeId: null,
  showImportDialog: false,
  toasts: [],

  selectNode: (id) => set({ selectedNodeId: id }),

  setImportDialog: (show) => set({ showImportDialog: show }),

  addToast: (message, type = 'info') => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
