'use client';
import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeSceneMultiDetailView from './CrimeSceneMultiDetailView';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import {
  flattenGroupChronological,
  groupScenesByCvr,
  normalizeCvrKey,
  type CrimeSceneCvrGroup,
} from '@/lib/crimeSceneGrouping';
import { ArrowLeft, CheckCircle, ExternalLink, Clock, ChevronDown, ChevronRight } from 'lucide-react';

type FilterTab = 'ALL' | 'TODAY';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'All crime scenes', value: 'ALL' },
  { label: 'Reported today', value: 'TODAY' },
];

/** Matches DatePicker storage: DD-MM-YYYY or YYYY-MM-DD */
function parseSceneDateString(dateStr: string): Date | null {
  const s = dateStr?.trim();
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length !== 3) return null;
  const n = parts.map((p) => Number(p));
  if (n.some((x) => Number.isNaN(x))) return null;
  if (parts[0].length === 4) {
    const [year, month, day] = n;
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = n;
  return new Date(year, month - 1, day);
}

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isReportedToPoliceToday(scene: CrimeScene): boolean {
  const d = parseSceneDateString(scene.reportedToPoliceStation?.date ?? '');
  if (!d || Number.isNaN(d.getTime())) return false;
  return isSameLocalCalendarDay(d, new Date());
}

/** Visit record saved/updated today (e.g. new revisit submitted today). */
function isVisitSubmittedToday(scene: CrimeScene): boolean {
  const d = new Date(scene.updatedAt);
  if (Number.isNaN(d.getTime())) return false;
  return isSameLocalCalendarDay(d, new Date());
}

/** Whole CVR row shows in Today tab if any visit matches police-report date today or was submitted today. */
function groupInTodayTab(group: CrimeSceneCvrGroup): boolean {
  const rows = [group.primary, ...group.children];
  return rows.some((s) => isReportedToPoliceToday(s) || isVisitSubmittedToday(s));
}

function sceneSearchHaystack(scene: CrimeScene): string {
  const offenceText = Array.isArray(scene.offence)
    ? scene.offence.join(' ')
    : (scene.offence as string) || '';
  return [
    scene.cvrNo,
    scene.visitType === 'REVISIT'
      ? 'revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'court visit'
        : 'new visit',
    scene.policeStation,
    scene.division,
    scene.placeOfCrimeScene,
    scene.crimeSceneType,
    scene.crimeSceneType === 'Others' ? scene.crimeSceneTypeOther : '',
    scene.incidentKnown?.date,
    scene.incidentKnown?.time,
    scene.incidentFrom?.date,
    scene.incidentFrom?.time,
    scene.incidentTo?.date,
    scene.incidentTo?.time,
    scene.offenceType === 'Other' ? scene.offenceTypeOther : scene.offenceType,
    offenceText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function visitTypePill(scene: CrimeScene) {
  const pill =
    scene.visitType === 'REVISIT'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : scene.visitType === 'COURT_VISIT'
        ? 'bg-violet-100 text-violet-900 border-violet-300'
        : 'bg-blue-100 text-blue-800 border-blue-300';
  const label =
    scene.visitType === 'REVISIT'
      ? 'Revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'Court Visit'
        : 'New Visit';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pill}`}>
      {label}
    </span>
  );
}

/** Expanded list row: strong left stripe + tint by visit type so visits are easy to tell apart. */
function visitTypeListRowClasses(scene: CrimeScene) {
  if (scene.visitType === 'REVISIT') {
    return 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-200/70 border-l-[5px] border-l-amber-500';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'border-violet-200 bg-violet-50/80 ring-1 ring-violet-200/70 border-l-[5px] border-l-violet-500';
  }
  return 'border-blue-200 bg-blue-50/80 ring-1 ring-blue-200/70 border-l-[5px] border-l-blue-500';
}

function visitTypeVisitBadgeClasses(scene: CrimeScene) {
  if (scene.visitType === 'REVISIT') {
    return 'bg-amber-200 text-amber-950 border-amber-400';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'bg-violet-200 text-violet-950 border-violet-400';
  }
  return 'bg-blue-200 text-blue-950 border-blue-400';
}

const tableClasses = {
  wrapper: 'overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white',
  thead: 'bg-gray-50 border-b border-gray-200',
  th: 'text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide',
  thRight: 'text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide',
  tr: 'border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors',
  td: 'px-4 py-3 text-sm',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmittedCrimeScenesPage() {
  const searchParams = useSearchParams();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const targetCvr = (searchParams.get('cvrNo') ?? '').trim();
  const sceneId = (searchParams.get('id') ?? '').trim();
  const detailCvrParam = (searchParams.get('cvrNo') ?? '').trim();

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const allGroups = useMemo(() => groupScenesByCvr(scenes), [scenes]);

  const filteredGroups = useMemo(() => {
    let g = allGroups;
    if (filter === 'TODAY') {
      g = g.filter((group) => groupInTodayTab(group));
    }
    const q = searchTerm.trim().toLowerCase();
    if (!q) return g;
    return g.filter((group) => {
      const rows = [group.primary, ...group.children];
      return rows.some((scene) => sceneSearchHaystack(scene).includes(q));
    });
  }, [allGroups, filter, searchTerm]);

  const sortedGroups = useMemo(() => {
    const data = [...filteredGroups];
    const key = sortKey ?? 'updatedAt';
    const read = (group: CrimeSceneCvrGroup): string => {
      const row = group.primary;
      switch (key) {
        case 'cvrNo':
          return group.displayCvr ?? '';
        case 'visitType':
          return row.visitType ?? '';
        case 'policeStation':
          return row.policeStation ?? '';
        case 'division':
          return row.division ?? '';
        case 'placeOfCrimeScene':
          return row.placeOfCrimeScene ?? '';
        case 'updatedAt':
          return row.updatedAt ?? '';
        default:
          return '';
      }
    };
    data.sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      if (key === 'updatedAt') {
        const cmp = new Date(av).getTime() - new Date(bv).getTime();
        return sortAsc ? cmp : -cmp;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return data;
  }, [filteredGroups, sortKey, sortAsc]);

  const toggleExpanded = useCallback((groupKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  function handleSort(key: keyof CrimeScene | string) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const countFor = (tab: FilterTab) => {
    if (tab === 'ALL') return allGroups.length;
    return allGroups.filter((g) => groupInTodayTab(g)).length;
  };

  const relatedScenesForDetail = useMemo(() => {
    if (detailCvrParam) {
      return scenes
        .filter((s) => (s.cvrNo ?? '').trim() === detailCvrParam)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (sceneId) {
      const anchor = scenes.find((s) => s.id === sceneId);
      if (!anchor) return [];
      const key = normalizeCvrKey(anchor);
      return scenes
        .filter((s) => normalizeCvrKey(s) === key)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return [];
  }, [detailCvrParam, sceneId, scenes]);

  const detailTitle = useMemo(() => {
    if (relatedScenesForDetail.length === 0) return '';
    const first = relatedScenesForDetail[0];
    return (first.cvrNo ?? '').trim() || first.id;
  }, [relatedScenesForDetail]);

  const isDetailMode = Boolean(detailCvrParam || sceneId);

  if (isDetailMode) {
    if (relatedScenesForDetail.length === 0) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 relative z-10 w-full pt-14">
            <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-500">
                  <p className="text-lg font-semibold">Crime scene not found.</p>
                  <Link href="/crime-visit-registry/submitted-crime-scenes" className="text-sm text-blue-600 hover:underline">
                    ← Back to Submitted Crime Scenes
                  </Link>
                </div>
              </div>
              <Footer />
            </main>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 relative z-10 w-full pt-14">
          <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Link
                  href="/crime-visit-registry/submitted-crime-scenes"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900">{detailTitle}</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Submitted
                    </span>
                    {relatedScenesForDetail.length > 1 ? (
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                        {relatedScenesForDetail.length} visits
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    All visits for this CVR are listed below.
                  </p>
                </div>
              </div>

              <CrimeSceneMultiDetailView scenes={relatedScenesForDetail} />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    );
  }

  const viewHrefForGroup = (group: CrimeSceneCvrGroup) => {
    const cvr = (group.primary.cvrNo ?? '').trim();
    if (cvr) {
      return `/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(cvr)}`;
    }
    return `/crime-visit-registry/submitted-crime-scenes?id=${encodeURIComponent(group.primary.id)}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Page header */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Link
                  href="/crime-visit-registry"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Submitted Crime Scenes</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    One row per CVR — expand for other visits. View shows every visit for that CVR. Reported today
                    lists a CVR if any visit was submitted today or has today&apos;s date in reported to police.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {allGroups.length} CVR{allGroups.length === 1 ? '' : 's'} · {scenes.length} visit{scenes.length === 1 ? '' : 's'}
              </span>
            </div>

            {targetCvr && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Recently saved CVR: <span className="font-semibold">{targetCvr}</span>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                      filter === tab.value
                        ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                        filter === tab.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {countFor(tab.value)}
                    </span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CVR no, station, division, place, offence..."
                className="w-full md:w-96 min-h-10 mb-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {sortedGroups.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No submitted crime scenes found.</div>
            ) : (
              <div className={tableClasses.wrapper}>
                <table className="w-full text-sm text-gray-900">
                  <thead>
                    <tr className={tableClasses.thead}>
                      <th className={`${tableClasses.th} w-10`} aria-label="Expand" />
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('cvrNo')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          CVR No.
                        </button>
                      </th>
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('visitType')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Visit Type
                        </button>
                      </th>
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('policeStation')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Police Station
                        </button>
                      </th>
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('division')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Division
                        </button>
                      </th>
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('placeOfCrimeScene')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Crime Scene
                        </button>
                      </th>
                      <th className={tableClasses.th}>
                        <button
                          type="button"
                          onClick={() => handleSort('updatedAt')}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          Submitted
                        </button>
                      </th>
                      <th className={tableClasses.thRight}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGroups.map((group) => {
                      const { primary, children, groupKey } = group;
                      const hasChildren = children.length > 0;
                      const open = expandedKeys.has(groupKey);
                      const chron = hasChildren ? flattenGroupChronological(group) : [];
                      const primaryVisitNo = chron.length
                        ? chron.findIndex((c) => c.id === primary.id) + 1
                        : 1;
                      return (
                        <Fragment key={groupKey}>
                          <tr
                            className={`${tableClasses.tr} ${hasChildren ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (hasChildren) toggleExpanded(groupKey);
                            }}
                          >
                            <td className={tableClasses.td}>
                              {hasChildren ? (
                                <span className="inline-flex text-gray-500" aria-hidden>
                                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </span>
                              ) : (
                                <span className="inline-block w-4" />
                              )}
                            </td>
                            <td className={tableClasses.td}>
                              <span className="font-mono text-xs text-blue-700 font-semibold">
                                {group.displayCvr}
                              </span>
                            </td>
                            <td className={tableClasses.td}>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {hasChildren ? (
                                  <span
                                    className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border text-[10px] font-bold tabular-nums ${visitTypeVisitBadgeClasses(primary)}`}
                                    title="Visit order (by created date) for this CVR"
                                  >
                                    {primaryVisitNo}
                                  </span>
                                ) : null}
                                {visitTypePill(primary)}
                                {hasChildren ? (
                                  <span className="text-[10px] font-medium text-gray-500">
                                    +{children.length} more
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={tableClasses.td}>
                              {primary.policeStation || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={tableClasses.td}>
                              {primary.division || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={tableClasses.td}>
                              {primary.placeOfCrimeScene || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={tableClasses.td}>
                              <span className="text-gray-700 text-xs">
                                {formatDateTimeDDMMYYYY(primary.updatedAt)}
                              </span>
                            </td>
                            <td className={`${tableClasses.td} text-right`} onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={viewHrefForGroup(group)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </Link>
                            </td>
                          </tr>
                          {open && hasChildren ? (
                            <tr className="bg-slate-50/95 border-b border-slate-200">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                    Other visits (same CVR) — color matches visit type
                                  </p>
                                  <ul className="space-y-2.5">
                                    {chron.slice(1).map((child) => {
                                      const visitNo = chron.findIndex((c) => c.id === child.id) + 1;
                                      return (
                                        <li
                                          key={child.id}
                                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm ${visitTypeListRowClasses(child)}`}
                                        >
                                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <span
                                              className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border text-[11px] font-bold tabular-nums shrink-0 ${visitTypeVisitBadgeClasses(child)}`}
                                              title="Visit order for this CVR"
                                            >
                                              {visitNo}
                                            </span>
                                            {visitTypePill(child)}
                                            <span className="text-xs text-gray-700 font-medium">
                                              Submitted {formatDateTimeDDMMYYYY(child.updatedAt)}
                                            </span>
                                          </div>
                                          <Link
                                            href={viewHrefForGroup(group)}
                                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline shrink-0"
                                          >
                                            Open with all visits
                                          </Link>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
