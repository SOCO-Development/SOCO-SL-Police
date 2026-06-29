'use client';

import { useRouter } from 'next/navigation';
import CrimeVisitForm from './CrimeVisitForm';
import { crimeService } from '@/lib/api';
import type { InitiateVisitRequest } from '@/lib/api/types';
import type { CrimeVisitFormData } from '@/types/crimeVisit';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';
import { PageHeader, PageLayout } from '@/components/ui';
import { getErrorMessage } from '@/lib/alerts';

function toApiDate(d: { date?: string; time?: string } | undefined): string {
  if (!d?.date) return '';
  const parts = d.date.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d.date;
}

function toApiTime(d: { date?: string; time?: string } | undefined): string {
  if (!d?.time) return '';
  return d.time.length === 5 ? `${d.time}:00` : d.time;
}

export default function InitiateCrimeVisitPage() {
  const router = useRouter();
  const [popup, showPopup, closePopup] = useResultPopup();

  async function handleSubmit(data: CrimeVisitFormData) {
    try {
      const sectionA = data.sectionA;
      const sectionC = data.sectionC;

      const offenceIds: number[] = Array.isArray(sectionA.offence)
        ? sectionA.offence.map(Number).filter(id => !isNaN(id))
        : [];

      const payload: InitiateVisitRequest = {
        locationId: Number(sectionA.locationId) || 0,
        policeStationId: Number(sectionA.policeStationId) || 0,
        offenceIds,
        offenceType: sectionA.offenceType || '',
        outDate: toApiDate(sectionA.out),
        outTime: toApiTime(sectionA.out),
        outPage: Number(sectionA.out?.page) || 0,
        outPara: Number(sectionA.out?.para) || 0,
        vehicleId: Number(sectionC?.vehicleId) || 0,
        driverId: 1, // hardcoded for now
      };

      const result = await crimeService.initiateVisit(payload);
      showPopup('success', 'Visit Initiated', `Crime visit initiated successfully — ${result.message}`);
      setTimeout(() => router.push('/crime-visit-registry'), 2500);
    } catch (err) {
      showPopup('error', 'Submission Failed', getErrorMessage(err, 'An error occurred while submitting the visit.'));
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
