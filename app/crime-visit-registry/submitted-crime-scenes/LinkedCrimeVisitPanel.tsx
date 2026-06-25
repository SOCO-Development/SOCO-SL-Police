'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { crimeVisitService } from '@/lib/crimeVisitService';
import CrimeVisitDetailView from '@/app/crime-visit-registry/crime-visits/CrimeVisitDetailView';
import type { CrimeVisit } from '@/types/crimeVisit';
import { ExternalLink } from 'lucide-react';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide pb-2 mb-3 flex items-center gap-2">
      <span className="w-1.5 h-4 rounded-full bg-teal-500 inline-block flex-shrink-0" aria-hidden />
      {children}
    </h4>
  );
}

export default function LinkedCrimeVisitPanel({ visitId }: { visitId?: string }) {
  const [visit, setVisit] = useState<CrimeVisit | null | undefined>(undefined);

  useEffect(() => {
    const id = visitId?.trim();
    if (!id) {
      setVisit(null);
      return;
    }
    setVisit(crimeVisitService.getById(id) ?? null);
  }, [visitId]);

  if (!visitId?.trim()) return null;

  if (visit === undefined) {
    return (
      <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/60 animate-pulse">
        <div className="h-4 w-48 rounded bg-teal-100" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/70">
        <SectionTitle>Initiated Crime Visit</SectionTitle>
        <p className="text-sm text-amber-900">
          Linked visit record could not be found ({visitId}). It may have been deleted from this browser.
        </p>
      </div>
    );
  }

  const ref = visit.referenceNo ?? visit.id;

  return (
    <div className="p-5 rounded-xl border border-teal-200 bg-teal-50/60 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle>Initiated Crime Visit</SectionTitle>
          <p className="text-xs text-teal-900/80">
            Visit recorded before this crime scene — reference{' '}
            <span className="font-mono font-semibold text-teal-950">{ref}</span>
          </p>
        </div>
        <Link
          href={`/crime-visit-registry/crime-visits?id=${encodeURIComponent(visit.id)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          Open visit record
        </Link>
      </div>
      <CrimeVisitDetailView visit={visit} />
    </div>
  );
}
