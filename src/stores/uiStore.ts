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
  /** Bumped to ask the canvas to re-fit the viewport (after import/tidy). */
  fitViewNonce: number;
  // Actions
  selectNode: (id: string | null) => void;
  setImportDialog: (show: boolean) => void;
  addToast: (message: string, type?: 'info' | 'error' | 'success') => void;
  removeToast: (id: number) => void;
  requestFitView: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  selectedNodeId: null,
  showImportDialog: false,
  toasts: [],
  fitViewNonce: 0,

  selectNode: (id) => set({ selectedNodeId: id }),

  setImportDialog: (show) => set({ showImportDialog: show }),

  requestFitView: () => set({ fitViewNonce: get().fitViewNonce + 1 }),

  addToast: (message, type = 'info') => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
