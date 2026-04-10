'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitForm from './CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisitFormData } from '@/types/crimeVisit';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function InitiateCrimeVisitPage() {
    const router = useRouter();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }

    function handleSaveDraft(data: CrimeVisitFormData) {
        try {
            const created = crimeVisitService.createDraft(data);
            showToast(`Draft saved — ${created.referenceNo}`);
            setTimeout(() => router.push('/crime-visit-registry/drafts'), 1500);
        } catch {
            showToast('Failed to save draft.', 'error');
        }
    }

    function handleSubmit(data: CrimeVisitFormData) {
        try {
            const created = crimeVisitService.createSubmitted(data);
            showToast(`Crime Visit submitted — ${created.referenceNo}`);
            setTimeout(() => router.push('/crime-visit-registry/crime-visits'), 1500);
        } catch {
            showToast('Failed to submit.', 'error');
        }
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
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Initiate Visit</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Fill in the required details. Save as Draft anytime, or Submit when complete.
                                </p>
                            </div>
                        </div>

                        <CrimeVisitForm
                            onSaveDraft={handleSaveDraft}
                            onSubmit={handleSubmit}
                            onCancel={() => router.push('/crime-visit-registry')}
                        />
                    </div>
                    <Footer />
                </main>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {toast.message}
                </div>
            )}
        </div>
    );
}
