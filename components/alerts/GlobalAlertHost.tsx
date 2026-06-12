'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { subscribeToAlerts, type AlertPayload } from '@/lib/alerts';

const AUTO_DISMISS_MS = 4500;

export default function GlobalAlertHost() {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);

  useEffect(() => {
    return subscribeToAlerts((alert) => {
      setAlerts((prev) => [...prev, alert]);
      window.setTimeout(() => {
        setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
      }, AUTO_DISMISS_MS);
    });
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {alerts.map((alert) => {
        const isSuccess = alert.type === 'success';
        return (
          <div
            key={alert.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl text-white text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              isSuccess ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-snug">{alert.title}</p>
              {alert.message ? (
                <p className="text-white/90 text-xs mt-0.5 leading-relaxed">{alert.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss alert"
              onClick={() => setAlerts((prev) => prev.filter((item) => item.id !== alert.id))}
              className="shrink-0 rounded p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
