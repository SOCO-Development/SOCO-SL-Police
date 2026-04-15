'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import CrimeSceneRevisionDiff from '@/components/cvr/CrimeSceneRevisionDiff';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

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
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              crimeSceneService.approveAmendmentRequest(row.id);
              reload();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              crimeSceneService.rejectAmendmentRequest(row.id);
              reload();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
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
          <button
            type="button"
            onClick={() => setSelectedRevisionId(row.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            Review diff
          </button>
          <button
            type="button"
            onClick={() => {
              crimeSceneService.approveRevision(row.id);
              reload();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              crimeSceneService.rejectRevision(row.id);
              reload();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Link
                  href="/crime-visit-registry"
                  className={registryBackLinkClass}
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pending CVR Approvals</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Approve or reject permission requests first, then review amended records with field-level diffs.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
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
                placeholder="Search by CVR no, visit type, or updated date..."
                className="w-full md:w-96 min-h-10 mb-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            crimeSceneService.approveRevision(selectedRevision.id);
                            reload();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                        >
                          Approve changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            crimeSceneService.rejectRevision(selectedRevision.id);
                            reload();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        >
                          Reject &amp; restore
                        </button>
                      </div>
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
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
