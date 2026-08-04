'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import MultiSelect from '@/components/forms/MultiSelect';
import DatePicker from '@/components/forms/DatePicker';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { locationService, crimeService, userService } from '@/lib/api';
import { showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneRevisionDiff from '@/components/cvr/CrimeSceneRevisionDiff';
import { ActionChipButton, ApproveRejectActions, PageHeader, PageLayout, SearchInput } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

type FilterTab = 'REQUESTS' | 'REVISIONS';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'Pending CVRs', value: 'REQUESTS' },
  { label: 'Approved CVRs', value: 'REVISIONS' },
];

/** Accepts DD-MM-YYYY (DatePicker) or YYYY-MM-DD. */
function parseDDMMYYYY(dateStr: string): Date | null {
  const s = dateStr.trim();
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

function toApiDateString(dateStr: string): string | undefined {
  const parsed = parseDDMMYYYY(dateStr);
  if (!parsed) return undefined;
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function PendingCvrApprovalsPage() {
  const [requests, setRequests] = useState<CrimeScene[]>([]);
  const [revisions, setRevisions] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('REQUESTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [requestSortKey, setRequestSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [requestSortAsc, setRequestSortAsc] = useState(false);
  const [revisionSortKey, setRevisionSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [revisionSortAsc, setRevisionSortAsc] = useState(false);

  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingLabsData, setLoadingLabsData] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [isApproving, setIsApproving] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  async function resolveCurrentOfficerId(): Promise<number | null> {
    try {
      const userInfo = await userService.getCurrentUserInfo();
      return Number(userInfo?.systemUserId) || null;
    } catch (err) {
      console.error('Failed to resolve current officer id', err);
      return null;
    }
  }

  async function loadPendingRequestsFromBackend() {
    setLoadingRequests(true);
    try {
      const officerId = await resolveCurrentOfficerId();
      let items: any[] = [];
      if (officerId) {
        try {
          items = await crimeService.getPendingApprovalsByUserId(officerId, {
            locationIds: selectedLabIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
            fromDate: toApiDateString(dateFrom),
            toDate: toApiDateString(dateTo),
          });
        } catch (e) {
          console.warn('Backend pending approvals fetch warning', e);
        }
      }
      const mapped: CrimeScene[] = (items || []).map((item) => {
        const id = String(item.CVR_ID ?? item.INITIATE_CVR_ID ?? '');
        return {
          id,
          cvrNo: String(item.CVR_NO ?? id),
          cvrId: item.CVR_ID !== undefined ? Number(item.CVR_ID) : undefined,
          visitType: item.VISIT_TYPE_ID === '1' ? 'NEW_VISIT' : 'REVISIT',
          approval_status: 'In Progress',
          // Store LOCATION_ID in `division` so client-side filtering can compare against selectedLabIds
          division: item.LOCATION_ID != null ? String(item.LOCATION_ID) : '',
          createdAt: String(item.CREATED_DTM ?? new Date().toISOString()),
          updatedAt: String(item.CREATED_DTM ?? new Date().toISOString()),
        } as CrimeScene;
      });

      let localAll: CrimeScene[] = [];
      try {
        localAll = crimeSceneService.getAll() || [];
      } catch (err) {
        console.error('Failed to get local scenes', err);
      }

      const localPending = localAll.filter(
        (s) =>
          Boolean(s) &&
          (s.approval_status !== 'Approved' ||
            Boolean(s.cvrAmendment?.revisionPending) ||
            s.cvrAmendment?.requestStatus === 'pending')
      );

      const combined = [...mapped];
      for (const loc of localPending) {
        if (!loc) continue;
        const exists = combined.some(
          (c) =>
            c.id === loc.id ||
            (c.cvrNo && loc.cvrNo && c.cvrNo === loc.cvrNo) ||
            (c.cvrId && loc.cvrId && String(c.cvrId) === String(loc.cvrId))
        );
        if (!exists) {
          combined.push(loc);
        }
      }

      setRequests(combined);
    } catch (err) {
      console.error('Failed to load pending CVR approvals', err);
      try {
        const localAll = crimeSceneService.getAll() || [];
        const localPending = localAll.filter((s) => Boolean(s) && s.approval_status !== 'Approved');
        setRequests(localPending);
      } catch {
        setRequests([]);
      }
    } finally {
      setLoadingRequests(false);
    }
  }

  async function loadApprovedCrimeScenesFromBackend() {
    setLoadingRevisions(true);
    try {
      const officerId = await resolveCurrentOfficerId();
      let items: any[] = [];
      if (officerId) {
        try {
          items = await crimeService.getApprovedCrimeScenesByUserId(officerId, {
            locationIds: selectedLabIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
            fromDate: toApiDateString(dateFrom),
            toDate: toApiDateString(dateTo),
          });
        } catch (e) {
          console.warn('Backend approved CVRs fetch warning', e);
        }
      }
      const mapped: CrimeScene[] = (items || []).map((item) => {
        const id = String(item.CVR_ID ?? item.INITIATE_CVR_ID ?? '');
        return {
          id,
          cvrNo: String(item.CVR_NO ?? id),
          cvrId: item.CVR_ID !== undefined ? Number(item.CVR_ID) : undefined,
          visitType: item.VISIT_TYPE_ID === '1' ? 'NEW_VISIT' : 'REVISIT',
          approval_status: 'Approved',
          // Store LOCATION_ID in `division` so client-side filtering can compare against selectedLabIds
          division: item.LOCATION_ID != null ? String(item.LOCATION_ID) : '',
          createdAt: String(item.CREATED_DTM ?? new Date().toISOString()),
          updatedAt: String(item.CREATED_DTM ?? new Date().toISOString()),
        } as CrimeScene;
      });

      let localAll: CrimeScene[] = [];
      try {
        localAll = crimeSceneService.getAll() || [];
      } catch (err) {
        console.error('Failed to get local scenes', err);
      }

      const localApproved = localAll.filter(
        (s) => Boolean(s) && s.approval_status === 'Approved' && !s.cvrAmendment?.revisionPending
      );

      const combined = [...mapped];
      for (const loc of localApproved) {
        if (!loc) continue;
        const exists = combined.some(
          (c) =>
            c.id === loc.id ||
            (c.cvrNo && loc.cvrNo && c.cvrNo === loc.cvrNo) ||
            (c.cvrId && loc.cvrId && String(c.cvrId) === String(loc.cvrId))
        );
        if (!exists) {
          combined.push(loc);
        }
      }

      setRevisions(combined);
    } catch (err) {
      console.error('Failed to load approved CVRs', err);
      try {
        const localAll = crimeSceneService.getAll() || [];
        const localApproved = localAll.filter((s) => Boolean(s) && s.approval_status === 'Approved');
        setRevisions(localApproved);
      } catch {
        setRevisions([]);
      }
    } finally {
      setLoadingRevisions(false);
    }
  }

  async function handleApproveBackend(scene: CrimeScene, onApproveLocal: () => void) {
    const initiateId = Number(scene.cvrId);
    if (!initiateId) {
      onApproveLocal();
      return;
    }

    setIsApproving(true);
    try {
      const resolvedId = await resolveCurrentOfficerId();
      const approvedBy = resolvedId ?? 2;

      const response = await crimeService.approveCrimeScene({
        cvrId: initiateId,
        approved_by: approvedBy
      });

      showSuccessAlert('Success', response?.message || 'Crime scene approved successfully.');

      onApproveLocal();
    } catch (err) {
      console.error('Failed to approve crime scene on backend:', err);
      const msg = err instanceof Error ? err.message : 'API call failed.';
      showErrorAlert(
        'Staging Role Permission Check',
        `Backend returned: "${msg}". Approving locally for testing purposes.`
      );

      onApproveLocal();
    } finally {
      setIsApproving(false);
    }
  }

  function reload() {
    setHasLoaded(true);
    loadPendingRequestsFromBackend();
    loadApprovedCrimeScenesFromBackend();
  }

  useEffect(() => {
    locationService
      .getPrivilegedOrAllLocations()
      .then((data) => {
        if (data && data.length > 0) {
          const sorted = [...data].sort((a, b) => a.LOCATION_NAME.localeCompare(b.LOCATION_NAME));
          setLabs(sorted);
        }
      })
      .catch((err) => {
        console.error('Failed to load SOCO labs', err);
      });
  }, []);

  // Reset table when the location selection changes so stale data is never shown
  useEffect(() => {
    setRequests([]);
    setRevisions([]);
    setHasLoaded(false);
  }, [selectedLabIds]);

  const handleView = useCallback(async () => {
    if (selectedLabIds.length === 0) return;
    setLoadingLabsData(true);
    await Promise.all([
      loadPendingRequestsFromBackend(),
      loadApprovedCrimeScenesFromBackend(),
    ]);
    setHasLoaded(true);
    setLoadingLabsData(false);
  }, [selectedLabIds]);

  function baselineScene(row: CrimeScene): CrimeScene | null {
    const raw = row.cvrAmendment?.baselineJson;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CrimeScene;
    } catch {
      return null;
    }
  }

  const inDateRange = useCallback(
    (row: CrimeScene) => {
      if (!dateFrom && !dateTo) return true;
      const updated = new Date(row.updatedAt);
      if (Number.isNaN(updated.getTime())) return true;
      const from = parseDDMMYYYY(dateFrom);
      const to = parseDDMMYYYY(dateTo);
      if (from) {
        const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        if (updated < fromStart) return false;
      }
      if (to) {
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        if (updated > toEnd) return false;
      }
      return true;
    },
    [dateFrom, dateTo]
  );

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((row) => {
      // Location filter: only show rows whose LOCATION_ID (stored in division) is selected
      if (selectedLabIds.length > 0 && row.division) {
        if (!selectedLabIds.includes(row.division)) return false;
      }
      if (!inDateRange(row)) return false;
      if (!q) return true;
      const haystack = [row.cvrNo, row.id, row.visitType, formatDateTimeDDMMYYYY(row.updatedAt)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [requests, searchTerm, inDateRange, selectedLabIds]);

  const filteredRevisions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return revisions.filter((row) => {
      // Location filter: only show rows whose LOCATION_ID (stored in division) is selected
      if (selectedLabIds.length > 0 && row.division) {
        if (!selectedLabIds.includes(row.division)) return false;
      }
      if (!inDateRange(row)) return false;
      if (!q) return true;
      const haystack = [row.cvrNo, row.id, row.visitType, formatDateTimeDDMMYYYY(row.updatedAt)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [revisions, searchTerm, inDateRange, selectedLabIds]);

  const sortedRequests = useMemo(() => {
    const data = [...filteredRequests];
    if (!requestSortKey) return data;
    data.sort((a, b) => {
      const av =
        requestSortKey === 'updatedAt'
          ? new Date(a.updatedAt).getTime()
          : (((a as unknown) as Record<string, unknown>)[requestSortKey] ?? '').toString().toLowerCase();
      const bv =
        requestSortKey === 'updatedAt'
          ? new Date(b.updatedAt).getTime()
          : (((b as unknown) as Record<string, unknown>)[requestSortKey] ?? '').toString().toLowerCase();
      if (av < bv) return requestSortAsc ? -1 : 1;
      if (av > bv) return requestSortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredRequests, requestSortKey, requestSortAsc]);

  const sortedRevisions = useMemo(() => {
    const data = [...filteredRevisions];
    if (!revisionSortKey) return data;
    data.sort((a, b) => {
      const av =
        revisionSortKey === 'updatedAt'
          ? new Date(a.updatedAt).getTime()
          : (((a as unknown) as Record<string, unknown>)[revisionSortKey] ?? '').toString().toLowerCase();
      const bv =
        revisionSortKey === 'updatedAt'
          ? new Date(b.updatedAt).getTime()
          : (((b as unknown) as Record<string, unknown>)[revisionSortKey] ?? '').toString().toLowerCase();
      if (av < bv) return revisionSortAsc ? -1 : 1;
      if (av > bv) return revisionSortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredRevisions, revisionSortKey, revisionSortAsc]);

  const selectedRevision =
    sortedRevisions.find((row) => row.id === selectedRevisionId) ?? sortedRevisions[0] ?? null;

  const countFor = (tab: FilterTab) => (tab === 'REQUESTS' ? filteredRequests.length : filteredRevisions.length);

  function handleRequestSort(key: keyof CrimeScene | string) {
    if (requestSortKey === key) setRequestSortAsc((prev) => !prev);
    else {
      setRequestSortKey(key);
      setRequestSortAsc(true);
    }
  }

  function handleRevisionSort(key: keyof CrimeScene | string) {
    if (revisionSortKey === key) setRevisionSortAsc((prev) => !prev);
    else {
      setRevisionSortKey(key);
      setRevisionSortAsc(true);
    }
  }

  const requestColumns: AppTableColumn<CrimeScene>[] = [
    {
      key: 'cvrNo',
      label: 'CVR No.',
      sortable: true,
      render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.cvrNo ?? row.id}</span>,
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-700">
          {row.visitType === 'REVISIT' ? 'Revisit' : row.visitType === 'COURT_VISIT' ? 'Court' : 'New'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Submitted',
      sortable: true,
      render: (_, row) => <span className="text-gray-700 text-xs">{formatDateTimeDDMMYYYY(row.updatedAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <ApproveRejectActions
          onApprove={() => {
            handleApproveBackend(row, () => {
              crimeSceneService.updateApprovalStatus(row.id, 'Approved');
              crimeSceneService.approveAmendmentRequest(row.id);
              reload();
            });
          }}
          onReject={() => {
            crimeSceneService.updateApprovalStatus(row.id, 'Rejected');
            crimeSceneService.rejectAmendmentRequest(row.id);
            reload();
          }}
        />
      ),
    },
  ];

  const revisionColumns: AppTableColumn<CrimeScene>[] = [
    {
      key: 'cvrNo',
      label: 'CVR No.',
      sortable: true,
      render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.cvrNo ?? row.id}</span>,
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      sortable: true,
      render: (_, row) => (
        <span className="text-gray-700">
          {row.visitType === 'REVISIT' ? 'Revisit' : row.visitType === 'COURT_VISIT' ? 'Court' : 'New'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (_, row) => <span className="text-gray-700 text-xs">{formatDateTimeDDMMYYYY(row.updatedAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <ActionChipButton variant="blue" onClick={() => setSelectedRevisionId(row.id)}>
            Review diff
          </ActionChipButton>
          <ApproveRejectActions
            showIcons={false}
            onApprove={() => {
              handleApproveBackend(row, () => {
                crimeSceneService.approveRevision(row.id);
                reload();
              });
            }}
            onReject={() => {
              crimeSceneService.rejectRevision(row.id);
              reload();
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Pending CVR Approvals"
      //description="Approve or reject permission requests first, then review amended records with field-level diffs."
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-6">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="min-w-[220px] flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Select SOCO Location
            </label>
            <MultiSelect
              value={selectedLabIds}
              onChange={setSelectedLabIds}
              options={labs.map((l) => ({ value: String(l.LOCATION_ID), label: l.LOCATION_NAME }))}
              placeholder="Select SOCO Location"
            />
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">From</label>
            <DatePicker value={dateFrom} onChange={setDateFrom} />
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">To</label>
            <DatePicker value={dateTo} onChange={setDateTo} />
          </div>
          <button
            type="button"
            onClick={handleView}
            disabled={loadingLabsData || selectedLabIds.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[38px] flex items-center gap-1.5 shadow-sm border border-blue-700/10 hover:border-blue-700/25"
          >
            {loadingLabsData ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            View
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'group inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                  active
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    active ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                  )}
                >
                  {countFor(tab.value)}
                </span>
              </button>
            );
          })}
        </div>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by CVR no, visit type, or updated date..."
          wrapperClassName="w-full md:w-96 mb-2"
          className="min-h-10"
        />
      </div>

      {!hasLoaded ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Please select SOCO Location(s) and click the &quot;View&quot; button to load pending approvals.
        </div>
      ) : filter === 'REQUESTS' ? (
        <AppTable<CrimeScene>
          columns={requestColumns}
          data={sortedRequests}
          keyField="id"
          sortKey={requestSortKey}
          sortAsc={requestSortAsc}
          onSort={handleRequestSort}
          emptyMessage="No pending CVRs"
          variant="card"
        />
      ) : null}

      {hasLoaded && filter === 'REVISIONS' ? (
        <div className="space-y-6">
          <AppTable<CrimeScene>
            columns={revisionColumns}
            data={sortedRevisions}
            keyField="id"
            sortKey={revisionSortKey}
            sortAsc={revisionSortAsc}
            onSort={handleRevisionSort}
            emptyMessage="No approved CVRs"
            variant="card"
          />

          {selectedRevision ? (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
                <div>
                  <p className="font-mono font-semibold text-gray-900">{selectedRevision.cvrNo}</p>
                  <p className="text-xs text-gray-500">Compare previous vs proposed below</p>
                </div>
                <ApproveRejectActions
                  approveLabel="Approve changes"
                  rejectLabel="Reject & restore"
                  showIcons={false}
                  onApprove={() => {
                    handleApproveBackend(selectedRevision, () => {
                      crimeSceneService.approveRevision(selectedRevision.id);
                      reload();
                    });
                  }}
                  onReject={() => {
                    crimeSceneService.rejectRevision(selectedRevision.id);
                    reload();
                  }}
                />
              </div>
              <div className="p-4">
                {baselineScene(selectedRevision) ? (
                  <CrimeSceneRevisionDiff before={baselineScene(selectedRevision) as CrimeScene} after={selectedRevision} />
                ) : (
                  <p className="text-sm text-amber-800">Baseline snapshot missing - cannot diff.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </PageLayout>
  );
}
