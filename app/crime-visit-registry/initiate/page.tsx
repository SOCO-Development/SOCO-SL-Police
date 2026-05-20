'use client';

import { useRouter } from 'next/navigation';
import CrimeVisitForm from './CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisitFormData } from '@/types/crimeVisit';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';
import { PageHeader, PageLayout } from '@/components/ui';

export default function InitiateCrimeVisitPage() {
  const router = useRouter();
  const [popup, showPopup, closePopup] = useResultPopup();

  function handleSubmit(data: CrimeVisitFormData) {
    try {
      const created = crimeVisitService.createSubmitted(data);
      showPopup('success', 'Visit Submitted', `Crime visit submitted successfully — ${created.referenceNo}`);
      setTimeout(() => router.push('/crime-visit-registry'), 2500);
    } catch {
      showPopup('error', 'Submission Failed', 'An error occurred while submitting the visit. Please try again.');
    }
  }

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Initiate Visit"
        description="Fill in the required details and submit. After returning from the scene, create a Crime Scene record linked to this visit."
      />

      <CrimeVisitForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/crime-visit-registry')}
      />

      <ResultPopup {...popup} onClose={closePopup} />
    </PageLayout>
  );
}
