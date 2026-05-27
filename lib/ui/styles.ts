import { cn } from '@/lib/utils';

/** Shared field & layout class tokens — single source for all form/layout UI */

export const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

export const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400';

export const selectClass =
  'w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none pr-8 cursor-pointer text-sm text-gray-900 hover:border-gray-400 shadow-sm';

export const textareaClass =
  'w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400 resize-y text-gray-900 placeholder:text-gray-400 min-h-[120px]';

export const errorClass = 'text-xs text-red-600 mt-1';

export const backLinkClass =
  'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors duration-150 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1';

export const addRowButtonClass =
  'mt-3 text-sm text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded';

export const removeRowButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap';

/** @deprecated Use backLinkClass — kept for existing imports */
export const registryBackLinkClass = backLinkClass;

export const actionChipBase =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

export const actionChipVariantClass = {
  blue: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
  green: 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200',
  red: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200',
  amber: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200',
  sky: 'text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100 hover:border-sky-300',
  fuchsia: 'text-fuchsia-800 hover:text-fuchsia-950 border-transparent bg-transparent hover:bg-fuchsia-50',
} as const;

export const tabButtonActiveClass =
  'border-blue-600 text-blue-700 bg-blue-50/50';
export const tabButtonInactiveClass =
  'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50';

export const underlineTabActiveClass = 'border-blue-600 text-blue-600';
export const underlineTabInactiveClass =
  'border-transparent text-gray-500 hover:text-gray-700';

export function fieldClasses(...extra: Parameters<typeof cn>) {
  return cn(inputClass, ...extra);
}

/** Grid-lined table (row + column borders) — pairs with `.data-grid-table` in globals.css */
export const dataGridTableClass = 'data-grid-table w-full text-sm text-gray-900';
export const dataGridTableCompactClass = 'data-grid-table data-grid-table--compact w-full text-sm text-gray-900';

export const appTableClasses = {
  wrapper: 'overflow-x-auto rounded-xl border border-gray-300 shadow-sm bg-white',
  wrapperPlain: 'overflow-x-auto rounded-lg border border-gray-300 bg-white',
  table: dataGridTableClass,
  thead: '',
  th: 'text-left font-semibold uppercase tracking-wide',
  thRight: 'text-right font-semibold uppercase tracking-wide',
  tr: 'transition-colors',
  td: 'text-sm text-gray-900',
  empty: 'text-center py-20 text-gray-500',
} as const;
