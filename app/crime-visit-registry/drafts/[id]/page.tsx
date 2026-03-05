'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitForm from '@/components/forms/crime-visit/CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit, CrimeVisitFormData, DraftAdditions } from '@/types/crimeVisit';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
    params: Promise<{ id: string }>;
}

export default function DraftDetailPage({ params }: Props) {
    const router = useRouter();
    const [visit, setVisit] = useState<CrimeVisit | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [resolvedId, setResolvedId] = useState<string>('');

    useEffect(() => {
        params.then(({ id }) => {
            setResolvedId(id);
            const found = crimeVisitService.getById(id);
            setVisit(found ?? null);
            setLoading(false);
        });
    }, [params]);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }

    /** Called when user saves additional experts in append mode */
    function handleSaveAdditions(data: CrimeVisitFormData) {
        if (!resolvedId) return;
        try {
            const additions: DraftAdditions = {
                experts: data.sectionB?.experts ?? [],
            };
            const updated = crimeVisitService.updateDraft(resolvedId, additions);
            if (updated) {
                setVisit(updated);
                showToast('Draft updated with new additions.');
            }
        } catch {
            showToast('Failed to save additions.', 'error');
        }
    }

    /** Submit the draft (lock it) */
    function handleSubmit() {
        if (!resolvedId) return;
        try {
            const updated = crimeVisitService.submit(resolvedId);
            if (updated) {
                showToast(`Submitted — ${updated.referenceNo}`);
                setTimeout(() => router.push('/crime-visit-registry/crime-visits'), 1500);
            }
        } catch {
            showToast('Failed to submit.', 'error');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
                <p className="text-lg font-semibold">Draft not found.</p>
                <Link href="/crime-visit-registry/drafts" className="text-sm text-blue-600 hover:underline">
                    ← Back to Drafts
                </Link>
            </div>
        );
    }

    // Build initialData from the lockedSnapshot (read-only layer)
    const lockedData: CrimeVisitFormData = {
        sectionA: visit.lockedSnapshot?.sectionA ?? visit.sectionA,
        sectionB: visit.lockedSnapshot?.sectionB ?? visit.sectionB,
        sectionC: visit.lockedSnapshot?.sectionC ?? visit.sectionC,
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        {/* Page header */}
                        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/crime-visit-registry/drafts"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Draft — {visit.referenceNo}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Last updated: {formatDateTimeDDMMYYYY(visit.updatedAt)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4" /> Submit this Visit
                            </button>
                        </div>

                        {/* Note banner */}
                        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <span className="text-blue-500 text-lg mt-0.5">🔒</span>
                            <p className="text-sm text-blue-800">
                                Fields below are <strong>locked</strong> from your last save. Use the <span className="font-semibold text-amber-700">Add Additional Experts</span> section at the bottom of Section 2 to append new expert rows, then click <strong>Save Additions</strong>.
                            </p>
                        </div>

                        {/*
              Pass lockedData as initialData.
              lockedMode=true → all main fields read-only.
              appendMode=true → shows the editable "Add Additional Experts" table.
            */}
                        <CrimeVisitForm
                            initialData={lockedData}
                            lockedMode={true}
                            appendMode={true}
                            onSaveDraft={handleSaveAdditions}
                            onCancel={() => router.push('/crime-visit-registry/drafts')}
                        />
                    </div>
                    <Footer />
                </main>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {toast.message}
                </div>
            )}
        </div>
    );
}
