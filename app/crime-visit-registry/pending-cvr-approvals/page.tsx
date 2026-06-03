'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneRevisionDiff from '@/components/cvr/CrimeSceneRevisionDiff';
import { ActionChipButton, ApproveRejectActions, PageHeader, PageLayout, SearchInput, TabBar } from '@/components/ui';

type FilterTab = 'REQUESTS' | 'REVISIONS';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'Permission Requests', value: 'REQUESTS' },
  { label: 'Revised CVR', value: 'REVISIONS' },
];

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

  function reload() {
    setRequests(crimeSceneService.getPendingAmendmentRequests());
    setRevisions(crimeSceneService.getPendingRevisionApprovals());
  }

  useEffect(() => {
    reload();
  }, []);

  function baselineScene(row: CrimeScene): CrimeScene | null {
    const raw = row.cvrAmendment?.baselineJson;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CrimeScene;
    } catch {
      return null;
    }
  }

  const filteredRequests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((row) => {
      const haystack = [row.cvrNo, row.id, row.visitType, formatDateTimeDDMMYYYY(row.updatedAt)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [requests, searchTerm]);

  const filteredRevisions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return revisions;
    return revisions.filter((row) => {
      const haystack = [row.cvrNo, row.id, row.visitType, formatDateTimeDDMMYYYY(row.updatedAt)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [revisions, searchTerm]);

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

  const countFor = (tab: FilterTab) => (tab === 'REQUESTS' ? requests.length : revisions.length);

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
            crimeSceneService.approveAmendmentRequest(row.id);
            reload();
          }}
          onReject={() => {
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
              crimeSceneService.approveRevision(row.id);
              reload();
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

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
              <TabBar
                tabs={tabs.map((tab) => ({ ...tab, count: countFor(tab.value) }))}
                value={filter}
                onChange={setFilter}
              />
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CVR no, visit type, or updated date..."
                wrapperClassName="w-full md:w-96 mb-2"
                className="min-h-10"
              />
            </div>

            {filter === 'REQUESTS' ? (
              <AppTable<CrimeScene>
                columns={requestColumns}
                data={sortedRequests}
                keyField="id"
                sortKey={requestSortKey}
                sortAsc={requestSortAsc}
                onSort={handleRequestSort}
                emptyMessage="No pending update requests."
                variant="card"
              />
            ) : null}

            {filter === 'REVISIONS' ? (
              <div className="space-y-6">
                <AppTable<CrimeScene>
                  columns={revisionColumns}
                  data={sortedRevisions}
                  keyField="id"
                  sortKey={revisionSortKey}
                  sortAsc={revisionSortAsc}
                  onSort={handleRevisionSort}
                  emptyMessage="No amended records waiting for approval."
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
                          crimeSceneService.approveRevision(selectedRevision.id);
                          reload();
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
