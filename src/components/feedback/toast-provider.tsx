import React, { useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext } from './toast-context';
import type { ToastItem } from './toast-types';

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idPrefix = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss, idPrefix],
  );

  const success = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast],
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast],
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast],
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'warning', title, message });
    },
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      {/* Toast Viewport */}
      <div
        id="toast-viewport"
        role="region"
        aria-label="Thông báo hệ thống"
        className="pointer-events-none fixed bottom-0 right-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4 sm:p-6"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />,
            error: <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />,
            warning: <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />,
            info: <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-white dark:border-emerald-900/60 dark:bg-slate-900',
            error: 'border-red-200 bg-white dark:border-red-900/60 dark:bg-slate-900',
            warning: 'border-amber-200 bg-white dark:border-amber-900/60 dark:bg-slate-900',
            info: 'border-blue-200 bg-white dark:border-blue-900/60 dark:bg-slate-900',
          };

          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200',
                borders[toast.type],
              )}
            >
              {icons[toast.type]}
              <div className="min-w-0 flex-1">
                {toast.title && (
                  <h4 className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {toast.title}
                  </h4>
                )}
                <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-300">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
