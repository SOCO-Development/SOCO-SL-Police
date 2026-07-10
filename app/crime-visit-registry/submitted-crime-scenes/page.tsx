'use client';
import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CrimeSceneMultiDetailView from './CrimeSceneMultiDetailView';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { crimeService, userService } from '@/lib/api';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { normalizeCourtVisitUpdate } from '@/types/crimeScene';
import { PageHeader, PageLayout, TabBar, SearchInput, TableSortButton } from '@/components/ui';
import {
  flattenGroupChronological,
  groupScenesByCvr,
  normalizeCvrKey,
  type CrimeSceneCvrGroup,
} from '@/lib/crimeSceneGrouping';
import {
  registryWorkflowDisplayEntries,
  registryWorkflowListRowClasses,
  registryWorkflowBadgeClasses,
} from '@/lib/registryWorkflowDisplay';
import { CheckCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { appTableClasses } from '@/lib/ui/styles';

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
    scene.registryWorkflowUpdates?.length
      ? 'updated court details updated production analysis'
      : scene.registryWorkflowUpdate
        ? 'updated court details updated production analysis'
        : '',
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

function registryWorkflowPill(scene: CrimeScene) {
  const entries = registryWorkflowDisplayEntries(scene);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map((entry) => (
        <span
          key={`${entry.kind}-${entry.at}`}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${entry.pillClass}`}
          title={entry.title}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}

/** Expanded list row: strong left stripe + tint by visit type or workflow update so visits are easy to tell apart. */
function visitTypeListRowClasses(scene: CrimeScene) {
  const workflowClasses = registryWorkflowListRowClasses(scene);
  if (workflowClasses) return workflowClasses;
  
  if (scene.visitType === 'REVISIT') {
    return 'border-amber-200 bg-amber-50/80 ring-1 ring-amber-200/70 border-l-[5px] border-l-amber-500';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'border-violet-200 bg-violet-50/80 ring-1 ring-violet-200/70 border-l-[5px] border-l-violet-500';
  }
  return 'border-blue-200 bg-blue-50/80 ring-1 ring-blue-200/70 border-l-[5px] border-l-blue-500';
}

function visitTypeVisitBadgeClasses(scene: CrimeScene) {
  const workflowClasses = registryWorkflowBadgeClasses(scene);
  if (workflowClasses) return workflowClasses;
  
  if (scene.visitType === 'REVISIT') {
    return 'bg-amber-200 text-amber-950 border-amber-400';
  }
  if (scene.visitType === 'COURT_VISIT') {
    return 'bg-violet-200 text-violet-950 border-violet-400';
  }
  return 'bg-blue-200 text-blue-950 border-blue-400';
}

// ── Court visit synthetic rows ────────────────────────────────────────────────

interface CourtVisitEntry {
  /** Source scene (the one that has courtVisitUpdate). */
  scene: CrimeScene;
  /** Human-readable summary line. */
  summary: string;
  /** Saved timestamp for display. */
  savedAt: string;
}

/**
 * Builds synthetic court-visit display entries for all scenes in a group
 * that have courtVisitUpdate rows with actual data.
 */
function courtVisitEntriesForGroup(group: CrimeSceneCvrGroup): CourtVisitEntry[] {
  const allScenes = [group.primary, ...group.children];
  const entries: CourtVisitEntry[] = [];
  for (const scene of allScenes) {
    const { rows } = normalizeCourtVisitUpdate(scene.courtVisitUpdate);
    if (!rows.length) continue;
    const filled = rows.filter(
      (r) => r.testifiedOfficer?.trim() || r.visitDate?.trim() || r.visitDescription?.trim(),
    );
    if (!filled.length) continue;
    const first = filled[0];
    const officer = first.testifiedOfficer?.trim() || first.officerName?.trim() || '';
    const date = first.visitDate?.trim() || '';
    const parts = [officer && `Officer: ${officer}`, date && `Date: ${date}`].filter(Boolean);
    entries.push({
      scene,
      summary: parts.length ? parts.join(' · ') : `${filled.length} court visit row${filled.length > 1 ? 's' : ''}`,
      savedAt: scene.updatedAt,
    });
  }
  return entries;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmittedCrimeScenesPage() {
  const searchParams = useSearchParams();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const targetCvr = (searchParams.get('cvrNo') ?? '').trim();
  const sceneId = (searchParams.get('id') ?? '').trim();
  const detailCvrParam = (searchParams.get('cvrNo') ?? '').trim();
  const isDetailMode = Boolean(detailCvrParam || sceneId);

  useEffect(() => {
    // 1. Initial load from local storage
    const localScenes = crimeSceneService.getAll();
    setScenes(localScenes);

    // 2. Fetch and merge backend CVR visits by location ID
    userService.getCurrentUserInfo()
      .then((userInfo) => {
        if (userInfo && userInfo.locationId) {
          return crimeService.getVisitsByCvrLocationId(Number(userInfo.locationId));
        }
        return [];
      })
      .then((backendVisits) => {
        if (backendVisits && backendVisits.length > 0) {
          const mapped = backendVisits.map((item) => ({
            id: String(item.CVR_ID || item.INITIATE_CVR_ID),
            cvrNo: item.CVR_NO,
            cvrId: Number(item.CVR_ID),
            visitId: item.VISIT_ID,
            visitType: item.VISIT_TYPE_ID === '1' ? ('NEW_VISIT' as const) : ('REVISIT' as const),
            policeStation: '',
            reportedToPoliceStation: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
            reportedToSocoLab: { date: item.REPORTED_SOCO_DATE, time: item.REPORTED_SOCO_TIME },
            sceneInTime: item.SCENE_IN,
            sceneOutTime: item.SCENE_OUT,
            division: '',
            offence: {},
            offenceType: item.OFFENCE_TYPE,
            placeOfCrimeScene: item.PLACE_DETAIL,
            createdAt: item.CREATED_DTM || new Date().toISOString(),
            updatedAt: item.CREATED_DTM || new Date().toISOString(),
            inChargeOfficer: { name: '' },
            socoOfficers: [],
            specialistTeams: [],
            courtDetails: { sentToAnalysisRows: [], productionSentToCourtRows: [] },
          }));

          const latestLocal = crimeSceneService.getAll();
          const backendIds = new Set(mapped.map(s => String(s.cvrId)));
          const uniqueLocal = latestLocal.filter(s => !s.cvrId || !backendIds.has(String(s.cvrId)));
          setScenes([...mapped, ...uniqueLocal]);
        }
      })
      .catch((err) => {
        console.error('Failed to load CVR visits from backend location', err);
      });
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



  useEffect(() => {
    if (!isDetailMode || relatedScenesForDetail.length === 0) return;
    const firstScene = relatedScenesForDetail[0];
    const initiateId = Number(firstScene.cvrId);
    if (!initiateId) return;

    setHistoryLoading(true);
    crimeService.getVisitHistoryByCvrId(initiateId)
      .then((data) => {
        if (data) setHistoryList(data);
      })
      .catch((err) => {
        console.error('Failed to load CVR visit history', err);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [isDetailMode, relatedScenesForDetail]);

  if (isDetailMode) {
    if (relatedScenesForDetail.length === 0) {
      return (
        <PageLayout>
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-gray-500">
            <p className="text-lg font-semibold">Crime scene not found.</p>
            <Link href="/crime-visit-registry/submitted-crime-scenes" className="text-sm text-blue-600 hover:underline">
              ← Back to Submitted Crime Scenes
            </Link>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry/submitted-crime-scenes"
          title={detailTitle}
          description="All visits for this CVR are listed below."
        />
        <div className="flex flex-wrap items-center gap-2 mb-6 -mt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" /> Submitted
          </span>
          {relatedScenesForDetail.length > 1 ? (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
              {relatedScenesForDetail.length} visits
            </span>
          ) : null}
        </div>

        <CrimeSceneMultiDetailView scenes={relatedScenesForDetail} />

        {/* Database Visit History Section */}
        <div className="mt-12 space-y-4">
          <h3 className="text-base font-semibold text-gray-800 uppercase tracking-widest pb-2 border-b border-gray-200 flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0" />
            Backend Database Visit History Log
          </h3>
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : historyList.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Visit ID</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Offence Type</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Place</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scene Times</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyList.map((hist, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-blue-700">
                          {hist.VISIT_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {hist.VISIT_TYPE_ID === '1' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              New Visit
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Revisit
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {hist.OFFENCE_TYPE || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 max-w-xs truncate" title={hist.PLACE_DETAIL}>
                          {hist.PLACE_DETAIL || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                          {hist.SCENE_IN} - {hist.SCENE_OUT}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                          {hist.CREATED_BY_NAME || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 tabular-nums">
                          {hist.CREATED_DTM}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
              No backend visit history log rows found.
            </div>
          )}
        </div>
      </PageLayout>
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
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Submitted Crime Scenes"
        //description="One row per CVR — expand for other visits. View shows every visit for that CVR. Reported today lists a CVR if any visit was submitted today or has today's date in reported to police."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            {allGroups.length} CVR{allGroups.length === 1 ? '' : 's'} · {scenes.length} visit{scenes.length === 1 ? '' : 's'}
          </span>
        }
      />

            {targetCvr && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Recently saved CVR: <span className="font-semibold">{targetCvr}</span>
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
              <TabBar
                tabs={tabs.map((tab) => ({ ...tab, count: countFor(tab.value) }))}
                value={filter}
                onChange={setFilter}
              />
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CVR no, station, division, place, offence..."
                wrapperClassName="w-full md:w-96 mb-2"
                className="min-h-10"
              />
            </div>

            {sortedGroups.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No submitted crime scenes found.</div>
            ) : (
              <div className={appTableClasses.wrapper}>
                <table className={appTableClasses.table}>
                  <thead>
                    <tr className={appTableClasses.thead}>
                      <th className={`${appTableClasses.th} w-10`} aria-label="Expand" />
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('cvrNo')}>CVR No.</TableSortButton>
                      </th>
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('visitType')}>Visit Type</TableSortButton>
                      </th>
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('policeStation')}>Police Station</TableSortButton>
                      </th>
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('division')}>Division</TableSortButton>
                      </th>
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('placeOfCrimeScene')}>Crime Scene</TableSortButton>
                      </th>
                      <th className={appTableClasses.th}>
                        <TableSortButton onClick={() => handleSort('updatedAt')}>Submitted</TableSortButton>
                      </th>
                      <th className={appTableClasses.thRight}>Actions</th>
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
                      const courtVisitEntries = courtVisitEntriesForGroup(group);
                      const totalExtra = children.length + courtVisitEntries.length;
                      const hasExpanded = hasChildren || courtVisitEntries.length > 0;
                      return (
                        <Fragment key={groupKey}>
                          <tr
                            className={`${appTableClasses.tr} ${hasExpanded ? 'cursor-pointer' : ''}`}
                            onClick={() => {
                              if (hasExpanded) toggleExpanded(groupKey);
                            }}
                          >
                            <td className={appTableClasses.td}>
                              {hasExpanded ? (
                                <span className="inline-flex text-gray-500" aria-hidden>
                                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </span>
                              ) : (
                                <span className="inline-block w-4" />
                              )}
                            </td>
                            <td className={appTableClasses.td}>
                              <span className="font-mono text-xs text-blue-700 font-semibold">
                                {group.displayCvr}
                              </span>
                            </td>
                            <td className={appTableClasses.td}>
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
                                {registryWorkflowPill(primary)}
                                {hasExpanded ? (
                                  <span className="text-[10px] font-medium text-gray-500">
                                    +{totalExtra} more
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={appTableClasses.td}>
                              {primary.policeStation || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={appTableClasses.td}>
                              {primary.division || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={appTableClasses.td}>
                              {primary.placeOfCrimeScene || <span className="text-gray-500">—</span>}
                            </td>
                            <td className={appTableClasses.td}>
                              <span className="text-gray-700 text-xs">
                                {formatDateTimeDDMMYYYY(primary.updatedAt)}
                              </span>
                            </td>
                            <td className={`${appTableClasses.td} text-right`} onClick={(e) => e.stopPropagation()}>
                              <Link
                                href={viewHrefForGroup(group)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View
                              </Link>
                            </td>
                          </tr>
                          {open && hasExpanded ? (
                            <tr className="bg-slate-50/95 border-b border-slate-200">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-3">
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
                                            {registryWorkflowPill(child)}
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

                                    {/* Court visit synthetic rows */}
                                    {courtVisitEntries.map((entry, idx) => (
                                      <li
                                        key={`court-visit-${entry.scene.id}-${idx}`}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-sm border-violet-200 bg-violet-50/80 ring-1 ring-violet-200/70 border-l-[5px] border-l-violet-500"
                                      >
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                          <span
                                            className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md border text-[11px] font-bold tabular-nums shrink-0 bg-violet-200 text-violet-950 border-violet-400"
                                            title="Court visit record"
                                          >
                                            CV
                                          </span>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-violet-100 text-violet-900 border-violet-300">
                                            Court Visit
                                          </span>
                                          <span className="text-xs text-gray-700 font-medium">
                                            {entry.summary}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            · Saved {formatDateTimeDDMMYYYY(entry.savedAt)}
                                          </span>
                                        </div>
                                        <Link
                                          href={viewHrefForGroup(group)}
                                          className="text-xs font-semibold text-violet-700 hover:text-violet-900 hover:underline shrink-0"
                                        >
                                          Open with all visits
                                        </Link>
                                      </li>
                                    ))}
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
    </PageLayout>
  );
}
