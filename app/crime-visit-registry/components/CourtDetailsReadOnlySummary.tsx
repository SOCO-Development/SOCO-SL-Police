'use client';

import type { CrimeSceneCourtDetails } from '@/types/crimeScene';
import { getProductionPRDisplayLabel, productionPRHasOthersSelected } from '@/lib/productionPROptions';
import { formatAnalysisInstitutionDisplay } from '@/lib/analysisInstitutions';

function hasAnyCourtData(cd: CrimeSceneCourtDetails | undefined): boolean {
  if (!cd) return false;
  return Boolean(
    cd.productionPR === 'Yes' ||
      cd.productionPR === 'No' ||
      (cd.productionPRTypes?.length ?? 0) > 0 ||
      (cd.productionSentToCourtRows?.length ?? 0) > 0 ||
      (cd.sentToAnalysisRows?.length ?? 0) > 0,
  );
}

/** `all` — full snapshot. `productionSentToCourt` / `sentToAnalysis` — only that block (e.g. Update Court vs Production Analysis). */
export type CourtDetailsReadOnlyScope = 'all' | 'productionSentToCourt' | 'sentToAnalysis';

function hasDataForScope(cd: CrimeSceneCourtDetails, scope: CourtDetailsReadOnlyScope): boolean {
  if (scope === 'all') {
    return hasAnyCourtData(cd);
  }
  if (scope === 'productionSentToCourt') {
    return Boolean(
      cd.productionPR === 'Yes' ||
        cd.productionPR === 'No' ||
        (cd.productionPRTypes?.length ?? 0) > 0 ||
        (cd.productionSentToCourtRows?.length ?? 0) > 0,
    );
  }
  // sentToAnalysis
  return Boolean(
    cd.productionPR === 'Yes' ||
      cd.productionPR === 'No' ||
      (cd.productionPRTypes?.length ?? 0) > 0 ||
      (cd.sentToAnalysisRows?.length ?? 0) > 0,
  );
}

export default function CourtDetailsReadOnlySummary({
  courtDetails,
  title = 'Production (from crime scene submission)',
  className = '',
  scope = 'all',
  /** If set, replaces the default read-only line under the title (e.g. point users to an Edit action). */
  readOnlySubtext,
}: {
  courtDetails: CrimeSceneCourtDetails | undefined;
  title?: string;
  className?: string;
  /** Limit which court details blocks are shown. */
  scope?: CourtDetailsReadOnlyScope;
  readOnlySubtext?: string;
}) {
  if (!courtDetails || !hasDataForScope(courtDetails, scope)) {
    return (
      <div
        className={`rounded-lg border border-dashed border-gray-300 bg-gray-50/90 px-4 py-3 text-sm text-gray-600 ${className}`}
      >
        <p className="font-medium text-gray-800 mb-1">{title}</p>
        <p>No production details were saved when this crime scene was submitted.</p>
      </div>
    );
  }

  const cd = courtDetails!;
  const showProductionToCourt = scope === 'all' || scope === 'productionSentToCourt';
  const showSentToAnalysis = scope === 'all' || scope === 'sentToAnalysis';
  const readOnlyHint =
    scope === 'sentToAnalysis'
      ? 'Read-only — saved production and sent-to-analysis rows. Edit this visit’s sent-to-analysis block below.'
      : scope === 'productionSentToCourt'
        ? 'Read-only — production sent to court. Edit the form below; sent-to-analysis is updated from Production Analysis.'
        : 'Read-only reference — same data is loaded into the update form below.';
  const subtext = readOnlySubtext ?? readOnlyHint;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 text-sm space-y-3 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      <p className="text-xs text-slate-500">{subtext}</p>

      <div>
        <span className="text-[11px] font-semibold uppercase text-gray-500">Production Availability</span>
        <p className="text-gray-900 mt-0.5">{cd.productionPR === 'Yes' ? 'Yes' : cd.productionPR === 'No' ? 'No' : '—'}</p>
      </div>

      {cd.productionPR === 'Yes' && (cd.productionPRTypes?.length ?? 0) > 0 ? (
        <div>
          <span className="text-[11px] font-semibold uppercase text-gray-500">Selected production types</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(cd.productionPRTypes ?? []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
              >
                {getProductionPRDisplayLabel(t)}
              </span>
            ))}
          </div>
          {productionPRHasOthersSelected(cd.productionPRTypes) && cd.productionPROtherDetail?.trim() ? (
            <p className="mt-2 text-xs text-gray-700">
              <span className="font-semibold">Others: </span>
              {cd.productionPROtherDetail.trim()}
            </p>
          ) : null}
        </div>
      ) : null}

      {showSentToAnalysis && (cd.sentToAnalysisRows ?? []).length > 0 ? (
        <div>
          <span className="text-[11px] font-semibold uppercase text-gray-500">Productions sent to analysis institutes</span>
          <ul className="mt-1.5 space-y-1.5 text-xs text-gray-800">
            {(cd.sentToAnalysisRows ?? []).map((row, idx) => (
              <li key={`sa-${idx}-${row.productionRef}`} className="border-l-2 border-sky-400 pl-2">
                <span className="font-medium">{getProductionPRDisplayLabel(row.productionRef)}</span>
                {row.sentToAnalysis === 'Yes' ? (
                  <span className="text-gray-600">
                    {' '}
                    — {formatAnalysisInstitutionDisplay(row)}
                    {row.date ? ` · ${row.date}` : ''}
                    {row.refNo ? ` · Ref ${row.refNo}` : ''}
                  </span>
                ) : row.sentToAnalysis === 'No' ? (
                  <span className="text-gray-600"> — not sent for analysis</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showProductionToCourt && (cd.productionSentToCourtRows ?? []).length > 0 ? (
        <div>
          <span className="text-[11px] font-semibold uppercase text-gray-500">Production sent to court</span>
          <ul className="mt-1.5 space-y-1.5 text-xs text-gray-800">
            {(cd.productionSentToCourtRows ?? []).map((row, idx) => (
              <li key={`psc-${idx}-${row.productionRef}`} className="border-l-2 border-teal-400 pl-2">
                <span className="font-medium">{getProductionPRDisplayLabel(row.productionRef)}</span>
                {row.sentToCourt === 'Yes' ? (
                  <span className="text-gray-600">
                    {' '}
                    — sent {row.date ? `(${row.date})` : ''}
                    {row.courtName?.trim() ? ` · ${row.courtName.trim()}` : ''}
                    {row.courtCaseNo?.trim() ? ` · Case ${row.courtCaseNo.trim()}` : ''}
                  </span>
                ) : row.sentToCourt === 'No' ? (
                  <span className="text-gray-600"> — not sent to court</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
