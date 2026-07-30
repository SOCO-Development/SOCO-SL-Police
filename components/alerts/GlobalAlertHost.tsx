'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { subscribeToAlerts, subscribeToClearAlerts, type AlertPayload } from '@/lib/alerts';

const AUTO_DISMISS_MS = 4500;

export default function GlobalAlertHost() {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);

  useEffect(() => {
    return subscribeToAlerts((alert) => {
      setAlerts([alert]);
      window.setTimeout(() => {
        setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  useEffect(() => {
    return subscribeToClearAlerts(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {alerts.map((alert) => {
        const isSuccess = alert.type === 'success';
        return (
          <div
            key={alert.id}
            role="alert"
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-lg text-gray-900 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 border-b-4 ${
              isSuccess
                ? 'bg-emerald-100 border-emerald-500'
                : 'bg-red-100 border-red-500'
            }`}
          >
            <span
              className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
                isSuccess ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              {isSuccess ? (
                <Check className="h-6 w-6 text-white" strokeWidth={3} />
              ) : (
                <X className="h-6 w-6 text-white" strokeWidth={3} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-snug">{alert.title}</p>
              {alert.message ? (
                <p className="text-gray-700 text-sm mt-0.5 leading-relaxed">{alert.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss alert"
              onClick={() => setAlerts((prev) => prev.filter((item) => item.id !== alert.id))}
              className="shrink-0 flex items-center justify-center rounded p-1 text-gray-500 hover:text-gray-800 hover:bg-black/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
