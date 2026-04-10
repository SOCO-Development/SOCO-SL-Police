/**
 * Date formatting utilities — project standard: DD-MM-YYYY
 */

/** Format a Date or ISO string as DD-MM-YYYY */
export function formatDateDDMMYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}

/** Format a Date or ISO string as DD-MM-YYYY HH:MM */
export function formatDateTimeDDMMYYYY(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  const datePart = formatDateDDMMYYYY(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}`;
}

/** Date + time as stored on crime scene forms (DatePicker + TimePicker). */
export interface DateTimeParts {
  date: string;
  time: string;
}

/**
 * Parse DD-MM-YYYY or YYYY-MM-DD plus HH:mm into a local Date.
 * Returns null if any part is missing or invalid.
 */
export function parseDateTimeParts(dt: DateTimeParts): Date | null {
  const d = dt.date?.trim();
  const t = dt.time?.trim();
  if (!d || !t) return null;
  const parts = d.split('-');
  if (parts.length !== 3) return null;
  let year: number;
  let month: number;
  let day: number;
  if (parts[0].length === 4) {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else {
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  }
  const tm = t.split(':').map((x) => Number(x));
  if (tm.length < 2 || [year, month, day, tm[0], tm[1]].some((n) => Number.isNaN(n))) return null;
  const out = new Date(year, month - 1, day, tm[0], tm[1], 0, 0);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** Human-readable span between two date+time points (e.g. "2d 3h 15m"). */
export function formatIncidentDuration(from: DateTimeParts, to: DateTimeParts): string {
  const a = parseDateTimeParts(from);
  const b = parseDateTimeParts(to);
  if (!a || !b || b.getTime() < a.getTime()) return '--';
  const mins = Math.floor((b.getTime() - a.getTime()) / 60000);
  if (mins <= 0) return '0m';
  const days = Math.floor(mins / (24 * 60));
  const h = Math.floor((mins % (24 * 60)) / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}
