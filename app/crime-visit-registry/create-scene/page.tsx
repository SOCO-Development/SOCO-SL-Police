'use client';

import { useRouter } from 'next/navigation';
import CreateCrimeSceneForm from './CreateCrimeSceneForm';
import { showSuccessAlert } from '@/lib/alerts';
import { PageHeader, PageLayout } from '@/components/ui';

export default function CreateCrimeScenePage() {
  const router = useRouter();

  function handleSaved(payload: { cvrNo: string }) {
    showSuccessAlert('Crime Scene Saved', `Crime scene saved successfully — CVR: ${payload.cvrNo}`);
    setTimeout(() => router.push('/crime-visit-registry'), 2500);
  }

  function handleCancel() {
    router.push('/crime-visit-registry');
  }

  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry"
        title="Create Crime Scene"
        //description="Attach scenes to morning visits and save each scene with a CVR."
      />

      <CreateCrimeSceneForm onSaved={handleSaved} onCancel={handleCancel} />
    </PageLayout>
  );
}
