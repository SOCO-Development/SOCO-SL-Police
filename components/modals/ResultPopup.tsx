'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ResultPopupType = 'success' | 'error';

export interface ResultPopupProps {
  /** Whether the popup is visible */
  open: boolean;
  type: ResultPopupType;
  title: string;
  message?: string;
  /** Auto-dismiss after this many ms. 0 = no auto-dismiss. Default 4000. */
  autoDismissMs?: number;
  onClose: () => void;
}

/**
 * Reusable centred modal popup for save / submit results.
 * Shows a success (green) or error (red) state with title, optional message, and a close button.
 * Auto-dismisses after `autoDismissMs` ms (default 4 s) unless set to 0.
 */
export default function ResultPopup({
  open,
  type,
  title,
  message,
  autoDismissMs = 4000,
  onClose,
}: ResultPopupProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss
  useEffect(() => {
    if (!open || autoDismissMs === 0) return;
    timerRef.current = setTimeout(onClose, autoDismissMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, autoDismissMs, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === 'success';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-popup-title"
    >
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden
          animate-in fade-in zoom-in-95 duration-200
          ${isSuccess
            ? 'bg-white border-emerald-200'
            : 'bg-white border-red-200'
          }`}
      >
        {/* Coloured top bar */}
        <div className={`h-1.5 w-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />

        <div className="px-6 py-5">
          {/* Icon + close */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full
                ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}
            >
              {isSuccess
                ? <CheckCircle2 className="h-7 w-7 text-emerald-500" strokeWidth={1.8} />
                : <XCircle className="h-7 w-7 text-red-500" strokeWidth={1.8} />
              }
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="mt-0.5 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Text */}
          <h2
            id="result-popup-title"
            className={`text-base font-bold leading-snug mb-1
              ${isSuccess ? 'text-emerald-800' : 'text-red-800'}`}
          >
            {title}
          </h2>
          {message && (
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          )}

          {/* Action button */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[38px] rounded-lg px-5 py-2 text-sm font-semibold transition-colors
                ${isSuccess
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                }`}
            >
              {isSuccess ? 'Done' : 'Close'}
            </button>
          </div>
        </div>

        {/* Auto-dismiss progress bar */}
        {autoDismissMs > 0 && (
          <div className={`h-0.5 w-full ${isSuccess ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <div
              className={`h-full ${isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}
              style={{
                animation: `shrink-width ${autoDismissMs}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Convenience hook ─────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export interface PopupState {
  open: boolean;
  type: ResultPopupType;
  title: string;
  message?: string;
}

/**
 * Convenience hook — returns `[popupState, showPopup, closePopup]`.
 *
 * ```tsx
 * const [popup, showPopup, closePopup] = useResultPopup();
 *
 * showPopup('success', 'Saved!', 'Your changes have been saved.');
 *
 * <ResultPopup {...popup} onClose={closePopup} />
 * ```
 */
export function useResultPopup(): [
  PopupState,
  (type: ResultPopupType, title: string, message?: string) => void,
  () => void,
] {
  const [state, setState] = useState<PopupState>({
    open: false,
    type: 'success',
    title: '',
    message: undefined,
  });

  const show = useCallback((type: ResultPopupType, title: string, message?: string) => {
    setState({ open: true, type, title, message });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return [state, show, close];
}
