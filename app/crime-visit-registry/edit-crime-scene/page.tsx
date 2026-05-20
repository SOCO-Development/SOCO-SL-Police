'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import CreateCrimeSceneForm from '../create-scene/CreateCrimeSceneForm';
import { crimeSceneService } from '@/lib/crimeSceneService';
import { sceneMayEditAmended, sceneHasRevisionPending } from '@/lib/cvrWorkflow';
import { PageHeader, PageLayout } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

function EditCrimeSceneContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sceneId = (searchParams.get('id') ?? '').trim();
  const focus = searchParams.get('focus') as 'investigation' | 'court' | null;
  const validFocus = focus === 'investigation' || focus === 'court' ? focus : undefined;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const scene = useMemo(() => (sceneId ? crimeSceneService.getById(sceneId) : undefined), [sceneId]);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const gateMessage = useMemo(() => {
    if (!sceneId) return 'Missing crime scene id.';
    if (!scene) return 'Crime scene not found.';
    if (sceneHasRevisionPending(scene)) {
      return 'This CVR already has changes submitted and waiting for approval. You cannot edit until the approver finishes.';
    }
    if (!sceneMayEditAmended(scene)) {
      return 'You do not have permission to edit this CVR yet. Request an update from CVR Update Request and wait for approval.';
    }
    return null;
  }, [scene, sceneId]);

  if (!sceneId) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-gray-600">
        <p>Missing scene id.</p>
        <Link href="/crime-visit-registry/cvr-update-request" className="text-blue-600 hover:underline text-sm">
          Go to CVR Update Request
        </Link>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-gray-600">
        <p>Crime scene not found.</p>
        <Link href="/crime-visit-registry/submitted-crime-scenes" className="text-blue-600 hover:underline text-sm">
          Submitted crime scenes
        </Link>
      </div>
    );
  }

  if (gateMessage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-medium">{gateMessage}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/crime-visit-registry/cvr-update-request"
            className="inline-flex text-blue-700 font-semibold hover:underline"
          >
            CVR Update Request
          </Link>
          <span className="text-gray-400">·</span>
          <Link
            href="/crime-visit-registry/pending-cvr-approvals"
            className="inline-flex text-blue-700 font-semibold hover:underline"
          >
            Pending approvals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <CreateCrimeSceneForm
        editSceneId={sceneId}
        amendmentMode
        focusSection={validFocus}
        onCancel={() => router.push('/crime-visit-registry/cvr-update-request')}
        onSaved={({ cvrNo }) => {
          showToast(`Submitted for approval — ${cvrNo}`);
          setTimeout(() => router.push('/crime-visit-registry/pending-cvr-approvals'), 1600);
        }}
      />
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toast.message}
        </div>
      )}
    </>
  );
}

export default function EditCrimeScenePage() {
  return (
    <PageLayout>
      <PageHeader
        backHref="/crime-visit-registry/cvr-update-request"
        title="Amend crime scene"
        description="Changes are saved as a pending revision until an approver accepts them."
      />

      <Suspense
        fallback={<div className="text-sm text-gray-500 py-12 text-center">Loading…</div>}
      >
        <EditCrimeSceneContent />
      </Suspense>
    </PageLayout>
  );
}
