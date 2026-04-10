'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitList from './CrimeVisitList';
import CrimeVisitDetailView from '@/app/crime-visit-registry/crime-visits/CrimeVisitDetailView';
import CrimeVisitForm from '../initiate/CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { sortCrimeVisits } from '@/lib/crimeVisitSort';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit, CrimeVisitStatus, CrimeVisitFormData, DraftAdditions } from '@/types/crimeVisit';
import Button from '@/components/buttons/Button';
import { ArrowLeft, CheckCircle, Clock, Plus } from 'lucide-react';

type FilterTab = 'ALL' | CrimeVisitStatus;

const tabs: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
];

function ListView() {
  const [all, setAll] = useState<CrimeVisit[]>([]);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CrimeVisit | string | null>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    setAll(crimeVisitService.getAll());
  }, []);

  const visibleByStatus = filter === 'ALL' ? all : all.filter((v) => v.status === filter);
  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return visibleByStatus;
    return visibleByStatus.filter((v) => {
      const offenceText = Array.isArray(v.sectionA?.offence)
        ? v.sectionA.offence.join(' ')
        : (v.sectionA?.offence as string) || '';
      const haystack = [
        v.referenceNo,
        v.id,
        v.status,
        v.sectionC?.vehicleNo,
        v.sectionA?.requestDivision,
        v.sectionA?.requestFromStation,
        v.sectionA?.offenceType,
        offenceText,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [visibleByStatus, searchTerm]);

  const sortedVisible = useMemo(
    () => sortCrimeVisits(visible, sortKey, sortAsc),
    [visible, sortKey, sortAsc]
  );
  const countFor = (tab: FilterTab) => (tab === 'ALL' ? all.length : all.filter((v) => v.status === tab).length);

  const handleSort = (key: keyof CrimeVisit | string) => {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
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
                  <h2 className="text-2xl font-bold text-gray-900">Crime Visits</h2>
                  <p className="text-sm text-gray-500 mt-0.5">All crime visit records — draft and submitted.</p>
                </div>
              </div>
              <Button variant="primary" asChild>
                <Link href="/crime-visit-registry/initiate">
                  <Plus className="w-4 h-4" /> New Visit
                </Link>
              </Button>
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
                placeholder="Search by reference no, vehicle, station, division, offence..."
                className="w-full md:w-96 min-h-10 mb-2 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <CrimeVisitList
              visits={sortedVisible}
              showStatusBadge
              draftDetailBasePath="/crime-visit-registry/crime-visits"
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={handleSort}
              emptyMessage="No crime visits found for this filter."
            />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

function DetailView({ id }: { id: string }) {
  const router = useRouter();
  const [visit, setVisit] = useState<CrimeVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const found = crimeVisitService.getById(id);
    setVisit(found ?? null);
    setLoading(false);
  }, [id]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSubmitDraft(data: CrimeVisitFormData) {
    try {
      const additions: DraftAdditions = {
        experts: data.sectionB?.experts ?? [],
        in: data.sectionA?.in,
      };
      const updated = crimeVisitService.updateDraft(id, additions);
      if (updated) {
        const submitted = crimeVisitService.submit(id);
        if (submitted) {
          showToast(`Submitted — ${submitted.referenceNo}`);
          setVisit(submitted);
          setTimeout(() => router.push(`/crime-visit-registry/crime-visits?id=${id}`), 1200);
        }
      }
    } catch {
      showToast('Failed to save and submit additions.', 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-lg font-semibold">Record not found.</p>
        <Link href="/crime-visit-registry/crime-visits" className="text-sm text-blue-600 hover:underline">
          ← Back to Crime Visits
        </Link>
      </div>
    );
  }

  if (visit.status === 'DRAFT') {
    const lockedData: CrimeVisitFormData = {
      sectionA: visit.lockedSnapshot?.sectionA ?? visit.sectionA,
      sectionB: visit.lockedSnapshot?.sectionB ?? visit.sectionB,
      sectionC: visit.lockedSnapshot?.sectionC ?? visit.sectionC,
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 relative z-10 w-full pt-14">
          <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Link href="/crime-visit-registry/crime-visits" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900">{visit.referenceNo}</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      Draft
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Last updated: {formatDateTimeDDMMYYYY(visit.updatedAt)}</p>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-blue-600">🔒</span>
                  <p className="text-sm leading-6 text-blue-900">
                    Fields below are <strong>locked</strong> from your last save. Use the <span className="font-semibold text-amber-700">Add Additional Experts</span> section at the bottom of Section 2 to append new expert rows, then click <strong>Submit</strong>.
                  </p>
                </div>
              </div>

              <CrimeVisitForm
                initialData={lockedData}
                lockedMode
                appendMode
                onSubmit={handleSubmitDraft}
                onCancel={() => router.push('/crime-visit-registry/crime-visits')}
              />
            </div>
            <Footer />
          </main>
        </div>
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {toast.message}
          </div>
        )}
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
              <Link href="/crime-visit-registry/crime-visits" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">{visit.referenceNo}</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Submitted
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Submitted: {formatDateTimeDDMMYYYY(visit.updatedAt)}
                </p>
              </div>
            </div>

            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">This crime visit has been <strong>submitted</strong> and is now read-only.</p>
            </div>

            <CrimeVisitDetailView visit={visit} />
          </div>
          <Footer />
        </main>
      </div>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {toast.message}
        </div>
      )}
    </div>
  );
}

function CrimeVisitsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  return id ? <DetailView id={id} /> : <ListView />;
}

export default function CrimeVisitsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <CrimeVisitsContent />
    </Suspense>
  );
}

