'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CrimeVisitForm from './CrimeVisitForm';
import { crimeService } from '@/lib/api';
import type { CrimeVisitFormData } from '@/types/crimeVisit';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';
import { PageHeader, PageLayout } from '@/components/ui';

function toApiDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return ddmmyyyy;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function toApiTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1] ?? '00'}:${parts[2] ?? '00'}`;
  }
  return `${timeStr}:00:00`;
}

export default function InitiateCrimeVisitPage() {
  const router = useRouter();
  const [popup, showPopup, closePopup] = useResultPopup();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: CrimeVisitFormData) {
    setLoading(true);
    try {
      const sA = data.sectionA ?? {};
      const sC = data.sectionC ?? {};
      const out = sA.out ?? {};

      const payload = {
        locationId: Number(sA.locationId) || 0,
        policeStationId: Number(sA.policeStationId) || 0,
        offenceIds: (Array.isArray(sA.offence) ? sA.offence : sA.offence ? [sA.offence] : []).map(Number),
        offenceType: sA.offenceType || '',
        outDate: toApiDate(out.date ?? ''),
        outTime: toApiTime(out.time ?? ''),
        outPage: Number(out.page) || 0,
        outPara: Number(out.para) || 0,
        vehicleId: Number(sC.vehicleId) || 0,
        driverId: Number(sC.driverId) || 0,
      };

      const response = await crimeService.initiateVisit(payload);
      showPopup('success', 'Visit Initiated', `Visit initiated successfully — ID: ${response.visitId}`);
      setTimeout(() => router.push('/crime-visit-registry'), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showPopup('error', 'Submission Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Initiate Visit"
      />

      <CrimeVisitForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/crime-visit-registry')}
      />

      <ResultPopup {...popup} onClose={closePopup} />
    </PageLayout>
  );
}
