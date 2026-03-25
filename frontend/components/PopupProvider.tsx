'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface PopupContextValue {
  showMessage: (message: string, type?: ToastType) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const showMessage = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const showConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ title, message, resolve });
    });
  }, []);

  const closeConfirm = useCallback((confirmed: boolean) => {
    setConfirmState((current) => {
      if (current) current.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo<PopupContextValue>(
    () => ({
      showMessage,
      showConfirm,
    }),
    [showMessage, showConfirm]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}

      <div className="fixed top-20 right-4 z-[100] space-y-3">
        {toasts.map((toast) => {
          const styleMap: Record<ToastType, string> = {
            success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
            error: 'bg-red-500/20 border-red-500/40 text-red-200',
            info: 'bg-zinc-800 border-zinc-700 text-zinc-100',
          };

          return (
            <div
              key={toast.id}
              className={`min-w-[260px] max-w-sm border rounded-lg px-4 py-3 shadow-xl backdrop-blur-sm ${styleMap[toast.type]}`}
            >
              <div className="flex items-start gap-2">
                {toast.type === 'success' && <CheckCircle2 size={18} className="mt-0.5 text-emerald-300" />}
                {toast.type === 'error' && <XCircle size={18} className="mt-0.5 text-red-300" />}
                {toast.type === 'info' && <AlertTriangle size={18} className="mt-0.5 text-zinc-300" />}
                <p className="text-sm leading-relaxed">{toast.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-100">{confirmState.title}</h3>
            <p className="text-zinc-300 mt-2">{confirmState.message}</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => closeConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => closeConfirm(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-zinc-950 font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used inside PopupProvider');
  }
  return context;
}
