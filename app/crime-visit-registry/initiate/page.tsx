'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitForm from './CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisitFormData } from '@/types/crimeVisit';
import { registryBackLinkClass } from '@/app/crime-visit-registry/uiStyles';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

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
                                <h2 className="text-2xl font-bold text-gray-900">Initiate Visit</h2>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Fill in the required details and submit. After returning from the scene, create a Crime Scene record linked to this visit.
                                </p>
                            </div>
                        </div>

                        <CrimeVisitForm
                            onSubmit={handleSubmit}
                            onCancel={() => router.push('/crime-visit-registry')}
                        />
                    </div>
                    <Footer />
                </main>
            </div>

            <ResultPopup {...popup} onClose={closePopup} />
        </div>
    );
}
