'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CreateCrimeSceneForm from './CreateCrimeSceneForm';
import { crimeSceneService } from '@/lib/crimeSceneService';
import type { CrimeSceneFormData } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Page header */}
            <div className="flex items-center gap-3 mb-6">
              <Link
                href="/crime-visit-registry"
                className={registryBackLinkClass}
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Crime Scene</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Attach scenes to morning visits and save each scene with a CVR.
                </p>
              </div>
            </div>

            <CreateCrimeSceneForm onSaved={handleSaved} onCancel={handleCancel} />
          </div>
          <Footer />
        </main>
      </div>

      <ResultPopup {...popup} onClose={closePopup} />
    </div>
  );
}
