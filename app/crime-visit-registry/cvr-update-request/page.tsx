'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import {
  sceneHasRevisionPending,
  sceneMayEditAmended,
  sceneMayRequestUpdate,
} from '@/lib/cvrWorkflow';
import { ArrowLeft, ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';

type FilterTab = 'REQUEST' | 'PENDING' | 'APPROVED';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'Request Update', value: 'REQUEST' },
  { label: 'Awaiting Approval', value: 'PENDING' },
  { label: 'Approved to Edit', value: 'APPROVED' },
];

function visitLabel(scene: CrimeScene): string {
  const vt =
    scene.visitType === 'REVISIT'
      ? 'Revisit'
      : scene.visitType === 'COURT_VISIT'
        ? 'Court'
        : 'New';
  return `${scene.cvrNo || scene.id} — ${vt} — ${formatDateTimeDDMMYYYY(scene.updatedAt)}`;
}

export default function CvrUpdateRequestPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [filter, setFilter] = useState<FilterTab>('REQUEST');
  const [searchTerm, setSearchTerm] = useState('');
  const [requestSortKey, setRequestSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [requestSortAsc, setRequestSortAsc] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const requestableScenes = useMemo(
    () =>
      [...scenes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .filter((s) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return visitLabel(s).toLowerCase().includes(q);
        }),
    [scenes, searchTerm],
  );

  const permitted = useMemo(
    () => scenes.filter((s) => sceneMayEditAmended(s)),
    [scenes],
  );

  const revisionWaiting = useMemo(
    () => scenes.filter((s) => sceneHasRevisionPending(s)),
    [scenes],
  );

  const filteredRevisionWaiting = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return revisionWaiting;
    return revisionWaiting.filter((s) => visitLabel(s).toLowerCase().includes(q));
  }, [revisionWaiting, searchTerm]);

  const filteredPermitted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return permitted;
    return permitted.filter((s) => visitLabel(s).toLowerCase().includes(q));
  }, [permitted, searchTerm]);

  const sortedRequestableScenes = useMemo(() => {
    const data = [...requestableScenes];
    if (!requestSortKey) return data;

    const getComparable = (scene: CrimeScene): string | number => {
      if (requestSortKey === 'requestStatus') return scene.cvrAmendment?.requestStatus ?? '';
      if (requestSortKey === 'cvrNo') return scene.cvrNo ?? '';
      if (requestSortKey === 'visitType') return scene.visitType ?? '';
      if (requestSortKey === 'updatedAt') return new Date(scene.updatedAt).getTime();
      const value = ((scene as unknown) as Record<string, unknown>)[requestSortKey];
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return value.toLowerCase();
      return '';
    };

    data.sort((a, b) => {
      const av = getComparable(a);
      const bv = getComparable(b);
      if (av < bv) return requestSortAsc ? -1 : 1;
      if (av > bv) return requestSortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [requestableScenes, requestSortKey, requestSortAsc]);

  const countFor = (tab: FilterTab) => {
    if (tab === 'REQUEST') return scenes.length;
    if (tab === 'PENDING') return revisionWaiting.length;
    return permitted.length;
  };

  function refresh() {
    setScenes(crimeSceneService.getAll());
  }

  function handleRequestSort(key: keyof CrimeScene | string) {
    if (requestSortKey === key) setRequestSortAsc((prev) => !prev);
    else {
      setRequestSortKey(key);
      setRequestSortAsc(true);
    }
  }

  function requestUpdate(sceneId: string) {
    setMsg(null);
    const s = crimeSceneService.getById(sceneId);
    if (!s) {
      setMsg({ type: 'err', text: 'Record not found.' });
      return;
    }
    if (!sceneMayRequestUpdate(s)) {
      setMsg({
        type: 'err',
        text: 'Cannot request now (already pending request or a revision is awaiting approval).',
      });
      return;
    }
    const next = crimeSceneService.requestAmendmentPermission(sceneId);
    if (!next) {
      setMsg({ type: 'err', text: 'Request failed.' });
      return;
    }
    setMsg({ type: 'ok', text: 'Update request submitted. It will appear under Pending CVR Approvals for the approver.' });
    refresh();
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
      label: 'Updated',
      sortable: true,
      render: (_, row) => <span className="text-gray-700 text-xs">{formatDateTimeDDMMYYYY(row.updatedAt)}</span>,
    },
    {
      key: 'requestStatus',
      label: 'Request Status',
      sortable: true,
      render: (_, row) => {
        const status = row.cvrAmendment?.requestStatus;
        if (status === 'pending') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" />
              Pending permission
            </span>
          );
        }
        if (status === 'approved') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle className="w-3 h-3" />
              Approved to edit
            </span>
          );
        }
        if (status === 'rejected') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-3 h-3" />
              Rejected
            </span>
          );
        }
        return <span className="text-gray-500">None</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => {
        const canRequest = sceneMayRequestUpdate(row);
        return (
          <button
            type="button"
            onClick={() => requestUpdate(row.id)}
            disabled={!canRequest}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              canRequest
                ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
            }`}
          >
            Request update permission
          </button>
        );
      },
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
                  <h2 className="text-2xl font-bold text-gray-900">CVR Update Request</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Ask permission to amend a submitted CVR, then edit and submit for re-approval.
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

            {filter === 'REQUEST' ? (
              <div className="space-y-4">
                {msg ? (
                  <div
                    className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                      msg.type === 'ok'
                        ? 'bg-green-50 text-green-900 border border-green-200'
                        : 'bg-red-50 text-red-900 border border-red-200'
                    }`}
                  >
                    {msg.type === 'ok' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    {msg.text}
                  </div>
                ) : null}
                <AppTable<CrimeScene>
                  columns={requestColumns}
                  data={sortedRequestableScenes}
                  keyField="id"
                  sortKey={requestSortKey}
                  sortAsc={requestSortAsc}
                  onSort={handleRequestSort}
                  emptyMessage="No CVRs found for this filter."
                  variant="card"
                />
              </div>
            ) : null}

            {filter === 'PENDING' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5">
                <h3 className="text-sm font-semibold text-amber-950 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Awaiting approval (your revisions)
                </h3>
                {filteredRevisionWaiting.length === 0 ? (
                  <p className="text-sm text-amber-900/80">No revisions awaiting approval for this filter.</p>
                ) : (
                  <ul className="space-y-2">
                    {filteredRevisionWaiting.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-mono text-amber-950">{s.cvrNo}</span>
                        <Link
                          href={`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(s.cvrNo)}`}
                          className="text-amber-900 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          View CVR <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {filter === 'APPROVED' ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" /> Approved to edit - open and amend
                </h3>
                {filteredPermitted.length === 0 ? (
                  <p className="text-sm text-gray-500">No CVRs with edit permission yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                    {filteredPermitted.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div>
                          <div className="font-mono font-semibold text-blue-800">{s.cvrNo}</div>
                          <div className="text-xs text-gray-500">{visitLabel(s)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(s.cvrNo)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-xs font-semibold hover:bg-gray-100"
                          >
                            View all details <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/crime-visit-registry/edit-crime-scene?id=${encodeURIComponent(s.id)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100"
                          >
                            Edit &amp; submit for approval
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
