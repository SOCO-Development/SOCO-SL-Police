'use client';

import { useRouter } from 'next/navigation';
import CreateCrimeSceneForm from './CreateCrimeSceneForm';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';
import { PageHeader, PageLayout } from '@/components/ui';

export default function CreateCrimeScenePage() {
  const router = useRouter();
  const [popup, showPopup, closePopup] = useResultPopup();

  function handleSaved(payload: { cvrNo: string }) {
    showPopup('success', 'Crime Scene Saved', `Crime scene saved successfully — CVR: ${payload.cvrNo}`);
    setTimeout(
      () => router.push(`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(payload.cvrNo)}`),
      2500
    );
  }

  function handleCancel() {
    router.push('/crime-visit-registry');
  }

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Create Crime Scene"
        description="Attach scenes to morning visits and save each scene with a CVR."
      />

      <CreateCrimeSceneForm onSaved={handleSaved} onCancel={handleCancel} />

      <ResultPopup {...popup} onClose={closePopup} />
    </PageLayout>
  );
}
