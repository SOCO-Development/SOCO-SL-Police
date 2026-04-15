'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { sceneMayEditAmended } from '@/lib/cvrWorkflow';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft, ExternalLink } from 'lucide-react';

function label(scene: CrimeScene) {
  const vt =
    scene.visitType === 'REVISIT' ? 'Revisit' : scene.visitType === 'COURT_VISIT' ? 'Court' : 'New';
  return `${scene.cvrNo} — ${vt} — ${formatDateTimeDDMMYYYY(scene.updatedAt)}`;
}

export default function UpdateInvestigationDetailsPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const eligibleScenes = useMemo(
    () =>
      [...scenes]
        .filter((s) => sceneMayEditAmended(s))
        .filter((s) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return label(s).toLowerCase().includes(q);
        }),
    [scenes, searchTerm],
  );

  const sortedEligibleScenes = useMemo(() => {
    const data = [...eligibleScenes];
    if (!sortKey) return data;
    data.sort((a, b) => {
      const av =
        sortKey === 'updatedAt'
          ? new Date(a.updatedAt).getTime()
          : (((a as unknown) as Record<string, unknown>)[sortKey] ?? '').toString().toLowerCase();
      const bv =
        sortKey === 'updatedAt'
          ? new Date(b.updatedAt).getTime()
          : (((b as unknown) as Record<string, unknown>)[sortKey] ?? '').toString().toLowerCase();
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [eligibleScenes, sortKey, sortAsc]);

  function handleSort(key: keyof CrimeScene | string) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const columns: AppTableColumn<CrimeScene>[] = [
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
        <Link
          href={`/crime-visit-registry/edit-crime-scene?id=${encodeURIComponent(row.id)}&focus=investigation`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          Continue to form <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  const totalEligible = useMemo(
    () => scenes.filter((s) => sceneMayEditAmended(s)).length,
    [scenes],
  );

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
                  <h2 className="text-2xl font-bold text-gray-900">Update Investigation Details</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Only CVRs with approved edit access are listed. The form opens at investigation officers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
              <div className="px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 border-blue-600 text-blue-700 bg-blue-50/50">
                Eligible CVRs
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {totalEligible}
                </span>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CVR no, visit type, or updated date..."
                className="w-full md:w-96 min-h-10 mb-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {totalEligible === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                No eligible CVRs. Use{' '}
                <Link href="/crime-visit-registry/cvr-update-request" className="font-semibold underline">
                  CVR Update Request
                </Link>{' '}
                first, then return here after approval.
              </div>
            ) : (
              <AppTable<CrimeScene>
                columns={columns}
                data={sortedEligibleScenes}
                keyField="id"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                emptyMessage="No eligible CVRs found for this filter."
                variant="card"
              />
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
