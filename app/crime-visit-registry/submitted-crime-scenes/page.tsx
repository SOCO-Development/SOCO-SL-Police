'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeSceneDetailView from './CrimeSceneDetailView';
import AppTable, { type AppTableColumn } from '@/components/layout/AppTable';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeScene } from '@/types/crimeScene';
import { ArrowLeft, CheckCircle, ExternalLink, Clock } from 'lucide-react';

type FilterTab = 'ALL' | 'NEW_VISIT' | 'REVISIT';

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'New Visit', value: 'NEW_VISIT' },
  { label: 'Revisit', value: 'REVISIT' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubmittedCrimeScenesPage() {
  const searchParams = useSearchParams();
  const [scenes, setScenes] = useState<CrimeScene[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeScene | string | null>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const targetCvr = (searchParams.get('cvrNo') ?? '').trim();
  const sceneId = (searchParams.get('id') ?? '').trim();

  useEffect(() => {
    setScenes(crimeSceneService.getAll());
  }, []);

  const visibleByType = useMemo(
    () => (filter === 'ALL' ? scenes : scenes.filter((scene) => scene.visitType === filter)),
    [filter, scenes]
  );

  const visibleScenes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibleByType;
    return visibleByType.filter((scene) => {
      const offenceText = Array.isArray(scene.offence)
        ? scene.offence.join(' ')
        : (scene.offence as string) || '';
      const haystack = [
        scene.cvrNo,
        scene.visitType === 'REVISIT' ? 'revisit' : 'new visit',
        scene.policeStation,
        scene.division,
        scene.placeOfCrimeScene,
        scene.offenceType === 'Other' ? scene.offenceTypeOther : scene.offenceType,
        offenceText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [visibleByType, searchTerm]);

  const sortedScenes = useMemo(() => {
    const data = [...visibleScenes];
    const key = sortKey ?? 'updatedAt';
    data.sort((a, b) => {
      const read = (row: CrimeScene) => {
        switch (key) {
          case 'cvrNo':
            return row.cvrNo ?? '';
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
  }, [visibleScenes, sortKey, sortAsc]);

  function handleSort(key: keyof CrimeScene | string) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const countFor = (tab: FilterTab) =>
    tab === 'ALL' ? scenes.length : scenes.filter((scene) => scene.visitType === tab).length;

  const columns: AppTableColumn<CrimeScene>[] = [
    {
      key: 'cvrNo',
      label: 'CVR No.',
      sortable: true,
      render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold">{row.cvrNo || '—'}</span>,
    },
    {
      key: 'visitType',
      label: 'Visit Type',
      sortable: true,
      render: (_, row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            row.visitType === 'REVISIT'
              ? 'bg-amber-100 text-amber-700 border-amber-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}
        >
          {row.visitType === 'REVISIT' ? 'Revisit' : 'New Visit'}
        </span>
      ),
    },
    {
      key: 'policeStation',
      label: 'Police Station',
      sortable: true,
      render: (_, row) => row.policeStation || <span className="text-gray-500">—</span>,
    },
    {
      key: 'division',
      label: 'Division',
      sortable: true,
      render: (_, row) => row.division || <span className="text-gray-500">—</span>,
    },
    {
      key: 'placeOfCrimeScene',
      label: 'Crime Scene',
      sortable: true,
      render: (_, row) => row.placeOfCrimeScene || <span className="text-gray-500">—</span>,
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
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Link
          href={`/crime-visit-registry/submitted-crime-scenes?id=${row.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </Link>
      ),
    },
  ];
  const selectedScene = useMemo(
    () => (sceneId ? scenes.find((scene) => scene.id === sceneId) ?? null : null),
    [sceneId, scenes]
  );

  if (sceneId) {
    if (!selectedScene) {
      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
                    <h2 className="text-2xl font-bold text-gray-900">{selectedScene.cvrNo || selectedScene.id}</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3" /> Submitted
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Submitted: {formatDateTimeDDMMYYYY(selectedScene.updatedAt)}
                  </p>
                </div>
              </div>

              <CrimeSceneDetailView scene={selectedScene} />
            </div>
            <Footer />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
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
                    Grouped by CVR number — expand rows to view revisits.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5" />
                {scenes.length} submitted
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

            {sortedScenes.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No submitted crime scenes found.
              </div>
            ) : (
              <AppTable<CrimeScene>
                columns={columns}
                data={sortedScenes}
                keyField="id"
                sortKey={sortKey}
                sortAsc={sortAsc}
                onSort={handleSort}
                variant="card"
                emptyMessage="No submitted crime scenes found."
              />
            )}

          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}