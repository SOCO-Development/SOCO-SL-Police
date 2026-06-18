import type { AnalysisReportResult } from '@/types/crimeScene';

/** Annex numbers for “Analysis reports received” (matches common SOCO annex references). */
export const ANALYSIS_REPORT_ANNEX_VALUES = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1;
  return `Annex ${String(n).padStart(2, '0')}`;
});

export const ANALYSIS_REPORT_ANNEX_OPTIONS = ANALYSIS_REPORT_ANNEX_VALUES.map((v) => ({
  value: v,
  label: v,
}));

export const ANALYSIS_REPORT_RESULT_OPTIONS: AnalysisReportResult[] = [
  'Positive',
  'Negative',
  'Insufficient',
  'Destruction of Evidence',
  'Other',
];

export function analysisResultIsOther(result: string): boolean {
  return result === 'Other';
}
