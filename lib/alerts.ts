export type AlertType = 'success' | 'error';

export interface AlertPayload {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
}

type AlertListener = (alert: AlertPayload) => void;
type ClearListener = () => void;

const listeners = new Set<AlertListener>();
const clearListeners = new Set<ClearListener>();

function emit(type: AlertType, title: string, message?: string): void {
  const payload: AlertPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
  };
  listeners.forEach((listener) => listener(payload));
}

/** Show a global success alert (toast). */
export function showSuccessAlert(title: string, message?: string): void {
  emit('success', title, message);
}

/** Show a global error alert (toast). */
export function showErrorAlert(title: string, message?: string): void {
  emit('error', title, message);
}

/** Dismiss whatever global alert is currently showing, if any. */
export function clearAlerts(): void {
  clearListeners.forEach((listener) => listener());
}

/** Subscribe to global alerts — used by GlobalAlertHost. */
export function subscribeToAlerts(listener: AlertListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Subscribe to alert-clear requests — used by GlobalAlertHost. */
export function subscribeToClearAlerts(listener: ClearListener): () => void {
  clearListeners.add(listener);
  return () => clearListeners.delete(listener);
}

/** Extract a user-friendly message from unknown errors (e.g. ApiError). */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
