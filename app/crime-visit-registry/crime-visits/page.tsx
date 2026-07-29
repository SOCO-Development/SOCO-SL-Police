'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CrimeVisitList from './CrimeVisitList';
import CrimeVisitDetailView from '@/app/crime-visit-registry/crime-visits/CrimeVisitDetailView';
import CrimeVisitForm from '../initiate/CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { sortCrimeVisits } from '@/lib/crimeVisitSort';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit, CrimeVisitStatus, CrimeVisitFormData, DraftAdditions } from '@/types/crimeVisit';
import { PageHeader, PageLayout, Button, TabBar, SearchInput } from '@/components/ui';
import { CheckCircle, Plus } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '@/lib/alerts';

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
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Crime Visits"
        description="All crime visit records — draft and submitted."
        actions={
          <Button variant="primary" asChild>
            <Link href="/crime-visit-registry/initiate">
              <Plus className="w-4 h-4" /> New Visit
            </Link>
          </Button>
        }
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
                placeholder="Search by reference, vehicle, station..."
                wrapperClassName="w-full md:w-96 mb-2"
                className="min-h-10"
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
    </PageLayout>
  );
}

function DetailView({ id }: { id: string }) {
  const router = useRouter();
  const [visit, setVisit] = useState<CrimeVisit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = crimeVisitService.getById(id);
    setVisit(found ?? null);
    setLoading(false);
  }, [id]);

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
          showSuccessAlert('Submitted', `Submitted — ${submitted.referenceNo}`);
          setVisit(submitted);
          setTimeout(() => router.push(`/crime-visit-registry/crime-visits?id=${id}`), 1200);
        }
      }
    } catch {
      showErrorAlert('Error', 'Failed to save and submit additions.');
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
      <>
        <PageLayout>
          <PageHeader
            backHref="/crime-visit-registry/crime-visits"
            title={visit.referenceNo ?? visit.id}
            description={`Last updated: ${formatDateTimeDDMMYYYY(visit.updatedAt)}`}
          />
          <div className="flex flex-wrap items-center gap-2 mb-6 -mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Draft
            </span>
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
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <PageLayout>
        <PageHeader
          backHref="/crime-visit-registry/crime-visits"
          title={visit.referenceNo ?? visit.id}
          description={`Submitted: ${formatDateTimeDDMMYYYY(visit.updatedAt)}`}
        />
        <div className="flex flex-wrap items-center gap-2 mb-6 -mt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" /> Submitted
          </span>
        </div>

            <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">This crime visit has been <strong>submitted</strong> and is now read-only.</p>
            </div>

            <CrimeVisitDetailView visit={visit} />
      </PageLayout>
    </>
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

