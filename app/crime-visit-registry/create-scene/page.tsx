'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CreateCrimeSceneForm from './CreateCrimeSceneForm';
import { crimeSceneService } from '@/lib/crimeSceneService';
import type { CrimeSceneFormData } from '@/types/crimeScene';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateCrimeScenePage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleSaved(payload: { cvrNo: string }) {
    try {
      showToast(`Crime scene saved — ${payload.cvrNo}`);
      setTimeout(
        () => router.push(`/crime-visit-registry/submitted-crime-scenes?cvrNo=${encodeURIComponent(payload.cvrNo)}`),
        1500
      );
    } catch {
      showToast('Failed to save.', 'error');
    }
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium transition-all duration-300 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
