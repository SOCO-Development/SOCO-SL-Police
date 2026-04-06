'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function SubmittedCrimeScenesPage() {
  const [scenes, setScenes] = useState<CrimeScene[]>([]);

  useEffect(() => {
    const allScenes = crimeSceneService.getAll();
    setScenes(allScenes);
  }, []);

  const sortedScenes = useMemo(
    () =>
      [...scenes].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [scenes]
  );

  const columns: AppTableColumn<CrimeScene>[] = [
    {
      key: 'cvrNo',
      label: 'CVR Number',
      sortable: false,
      render: (_, row) => (
        <span className="font-mono text-xs text-blue-700 font-semibold">{row.cvrNo || '—'}</span>
      ),
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      sortable: false,
      render: (_, row) => (
        <span className="text-xs font-medium text-gray-700">{row.visitType === 'REVISIT' ? 'Revisit' : 'New Visit'}</span>
      ),
    },
    {
      key: 'policeStation',
      label: 'Police Station',
      sortable: false,
      render: (_, row) => row.policeStation || <span className="text-gray-500">—</span>,
    },
    {
      key: 'division',
      label: 'Division',
      sortable: false,
      render: (_, row) => row.division || <span className="text-gray-500">—</span>,
    },
    {
      key: 'placeOfCrimeScene',
      label: 'Crime Scene',
      sortable: false,
      render: (_, row) => row.placeOfCrimeScene || <span className="text-gray-500">—</span>,
    },
    {
      key: 'updatedAt',
      label: 'Submitted',
      sortable: false,
      render: (_, row) => <span className="text-xs text-gray-700">{formatDateTimeDDMMYYYY(row.updatedAt)}</span>,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <Link href="/crime-visit-registry" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Submitted Crime Scenes</h2>
                  <p className="text-sm text-gray-500 mt-0.5">All saved crime scene submissions under CVR records.</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {sortedScenes.length} submitted
              </span>
            </div>

            <AppTable<CrimeScene>
              columns={columns}
              data={sortedScenes}
              keyField="id"
              emptyMessage="No submitted crime scenes found."
              variant="card"
            />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
