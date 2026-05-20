'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CrimeVisitList from '../crime-visits/CrimeVisitList';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisit } from '@/types/crimeVisit';
import { Plus } from 'lucide-react';
import { PageHeader, PageLayout } from '@/components/ui';

export default function DraftedCrimeVisitsPage() {
  const [drafts, setDrafts] = useState<CrimeVisit[]>([]);

  function loadDrafts() {
    setDrafts(crimeVisitService.getDrafts());
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  function handleDelete(id: string) {
    if (!confirm('Delete this draft?')) return;
    crimeVisitService.delete(id);
    loadDrafts();
  }

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Drafted Crime Visits"
        description={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} — click Continue to append more details.`}
        actions={
          <Link
            href="/crime-visit-registry/initiate"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Visit
          </Link>
        }
      />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">ℹ</span>
          <p className="text-sm text-amber-800">
            When you open a draft, previously saved fields are <strong>read-only</strong>. You can append new expert entries in the editable section below the locked data.
          </p>
        </div>
      </div>

      <CrimeVisitList
        visits={drafts}
        onDelete={handleDelete}
        showStatusBadge={false}
        emptyMessage="No drafted crime visits. Start one by clicking 'New Visit'."
      />
    </PageLayout>
  );
}

