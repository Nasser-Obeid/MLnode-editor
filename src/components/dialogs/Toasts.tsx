/** Toast notifications rendered at bottom-right. */

import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export default function Toasts() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50" style={{ maxWidth: 380 }}>
      {toasts.map((t) => {
        const colors = {
          error: { bg: '#2d1215', border: '#7f1d1d', icon: '#f87171' },
          success: { bg: '#0d2818', border: '#14532d', icon: '#4ade80' },
          info: { bg: '#1a1a2e', border: '#27272f', icon: '#a78bfa' },
        }[t.type];
        const Icon = t.type === 'error' ? AlertCircle : t.type === 'success' ? CheckCircle : Info;

        return (
          <div
            key={t.id}
            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs animate-in slide-in-from-right"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: '#e4e4e7',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <Icon size={14} style={{ color: colors.icon, flexShrink: 0, marginTop: 1 }} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-zinc-500 hover:text-zinc-300">
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
