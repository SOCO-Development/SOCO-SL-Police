'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { crimeService } from '@/lib/api';
import type { FullCvrDetails, FullCvrVisitItem } from '@/lib/api/types';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';

// ─── Visit-type accent tokens (per design reference) ──────────────────────
// New Visit = indigo-blue, Revisit = teal. Hardcoded hex to match the
// approved design spec exactly (not the app's default Tailwind blue).

const TOKEN = {
  NEW_VISIT: {
    accent: '#3B5BDB',
    rowBg: '#F5F7FF',
    badgeBg: '#3B5BDB',
    badgeText: '#fff',
    softBg: '#EEF2FF',
    softText: '#3B5BDB',
    label: 'New Visit',
  },
  REVISIT: {
    accent: '#0D9488',
    rowBg: '#F0FDFA',
    badgeBg: '#0D9488',
    badgeText: '#fff',
    softBg: '#CCFBF1',
    softText: '#0F766E',
    label: 'Revisit',
  },
} as const;

function visitToken(visitTypeId: string) {
  return visitTypeId === '1' ? TOKEN.NEW_VISIT : TOKEN.REVISIT;
}

// ─── Status badge (from live approvalStatus) ───────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const norm = (status || 'In Progress').trim().toLowerCase();
  if (norm === 'approved' || norm === 'completed') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        {status || 'Completed'}
      </span>
    );
  }
  if (norm === 'rejected') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Rejected
      </span>
    );
  }
  if (norm === 'pending') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      In Progress
    </span>
  );
}

// ─── Station / Division name lookup ────────────────────────────────────────

export interface StationDivisionLookup {
  stationName: (policeStationId: string) => string;
  divisionName: (policeStationId: string) => string;
}

// ─── Nested visits table ────────────────────────────────────────────────────

interface VisitsTableProps {
  visits: FullCvrVisitItem[];
  lookup: StationDivisionLookup;
  onViewVisit: (visit: FullCvrVisitItem) => void;
}

function VisitsTable({ visits, lookup, onViewVisit }: VisitsTableProps) {
  // New Visit always listed before Revisit(s), regardless of API order.
  const sorted = [
    ...visits.filter((v) => v.visitTypeId === '1'),
    ...visits.filter((v) => v.visitTypeId !== '1'),
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mx-4 mb-3 shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-6" />
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Type</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Police Station</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Division</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Crime Scene</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Submitted</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((visit, idx) => {
            const t = visitToken(visit.visitTypeId);
            const isLast = idx === sorted.length - 1;
            const submitted = formatDateTimeDDMMYYYY(`${visit.reportedSocoDate}T${visit.reportedSocoTime || '00:00:00'}`);
            return (
              <tr
                key={visit.cvrId}
                style={{ background: t.rowBg, borderLeft: `3px solid ${t.accent}` }}
                className={isLast ? '' : 'border-b border-gray-100'}
              >
                <td className="pl-3 pr-1 py-3 align-middle">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white"
                    style={{ background: t.accent }}
                  >
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span
                    className="inline-flex px-2.5 py-0.5 rounded text-xs font-bold"
                    style={{ background: t.badgeBg, color: t.badgeText }}
                  >
                    {t.label}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-gray-700">
                  {lookup.stationName(visit.policeStationId) || '—'}
                </td>
                <td className="px-4 py-3 align-middle text-gray-700">
                  {lookup.divisionName(visit.policeStationId) || '—'}
                </td>
                <td className="px-4 py-3 align-middle text-gray-700">{visit.placeDetail || '—'}</td>
                <td className="px-4 py-3 align-middle text-gray-500 whitespace-nowrap">{submitted}</td>
                <td className="px-4 py-3 align-middle">
                  <StatusBadge status={visit.approvalStatus} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 border rounded-md px-3 py-1 text-xs font-semibold transition-colors"
                    style={{ borderColor: t.accent, color: t.accent, background: t.softBg }}
                    onClick={() => onViewVisit(visit)}
                  >
                    <Eye size={11} /> View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main expand panel: fetches full CVR details live, no hardcoded data ──

interface CvrVisitsExpandPanelProps {
  initiateCvrId: number;
  lookup: StationDivisionLookup;
  /** Called with the single visit the user clicked "View" on. */
  onViewVisit: (visit: FullCvrVisitItem) => void;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: FullCvrDetails };

/**
 * Fetches once per mount for a fixed `initiateCvrId`. The parent keys this
 * component by `initiateCvrId` (`key={initiateCvrId}`) so a different CVR
 * group remounts it fresh instead of reusing state — avoids resetting
 * loading/error state imperatively inside the effect.
 */
export default function CvrVisitsExpandPanel({ initiateCvrId, lookup, onViewVisit }: CvrVisitsExpandPanelProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    crimeService
      .getFullCvrDetailsByInitiateCvrId(initiateCvrId)
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', data: result });
      })
      .catch((err) => {
        console.error('Failed to load full CVR details', err);
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load visits.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initiateCvrId]);

  if (state.status === 'loading') {
    return (
      <div className="mx-4 mb-3 py-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        Loading visits…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-4 mb-3 py-6 text-center text-sm text-red-500">
        {state.message}
      </div>
    );
  }

  return <VisitsTable visits={state.data.visits} lookup={lookup} onViewVisit={onViewVisit} />;
}

// ─── CVR group row summary badges (counts) ─────────────────────────────────

export function VisitCountBadges({ visits }: { visits: FullCvrVisitItem[] }) {
  const revisitCount = visits.filter((v) => v.visitTypeId !== '1').length;
  const hasNewVisit = visits.some((v) => v.visitTypeId === '1');
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasNewVisit && (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: TOKEN.NEW_VISIT.softBg, color: TOKEN.NEW_VISIT.softText }}
        >
          New Visit
        </span>
      )}
      {revisitCount > 0 && (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: TOKEN.REVISIT.softBg, color: TOKEN.REVISIT.softText }}
        >
          {revisitCount} Revisit{revisitCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
