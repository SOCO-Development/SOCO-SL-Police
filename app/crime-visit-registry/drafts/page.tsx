'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitList from '../crime-visits/CrimeVisitList';
import CrimeVisitForm from '../initiate/CrimeVisitForm';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit, CrimeVisitFormData, DraftAdditions } from '@/types/crimeVisit';
import { ArrowLeft, CheckCircle, Plus } from 'lucide-react';

// ─── Drafts List ──────────────────────────────────────────────────────────────

function DraftsList() {
    const [drafts, setDrafts] = useState<CrimeVisit[]>([]);

    function loadDrafts() { setDrafts(crimeVisitService.getDrafts()); }
    useEffect(() => { loadDrafts(); }, []);

    function handleDelete(id: string) {
        if (!confirm('Delete this draft?')) return;
        crimeVisitService.delete(id);
        loadDrafts();
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Link href="/crime-visit-registry" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Drafted Crime Visits</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {drafts.length} draft{drafts.length !== 1 ? 's' : ''} — click <strong>Continue</strong> to append more details.
                                    </p>
                                </div>
                            </div>
                            <Link href="/crime-visit-registry/initiate" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                                <Plus className="w-4 h-4" /> New Visit
                            </Link>
                        </div>

                        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <span className="text-amber-500 text-lg mt-0.5">ℹ</span>
                            <p className="text-sm text-amber-800">
                                When you open a draft, previously saved fields are <strong>read-only</strong>. You can append new expert entries in the editable section below the locked data.
                            </p>
                        </div>

                        <CrimeVisitList
                            visits={drafts}
                            onDelete={handleDelete}
                            showStatusBadge={false}
                            emptyMessage="No drafted crime visits. Start one by clicking 'New Visit'."
                        />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}

// ─── Draft Detail / Edit ──────────────────────────────────────────────────────

function DraftDetail({ id }: { id: string }) {
    const router = useRouter();
    const [visit, setVisit] = useState<CrimeVisit | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const found = crimeVisitService.getById(id);
        setVisit(found ?? null);
        setLoading(false);
    }, [id]);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }

    function handleSaveAdditions(data: CrimeVisitFormData) {
        try {
            const additions: DraftAdditions = { experts: data.sectionB?.experts ?? [] };
            const updated = crimeVisitService.updateDraft(id, additions);
            if (updated) { setVisit(updated); showToast('Draft updated with new additions.'); }
        } catch {
            showToast('Failed to save additions.', 'error');
        }
    }

    function handleSubmit() {
        try {
            const updated = crimeVisitService.submit(id);
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
                <Link href="/crime-visit-registry/drafts" className="text-sm text-blue-600 hover:underline">← Back to Drafts</Link>
            </div>
        );
    }

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
                        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Link href="/crime-visit-registry/drafts" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Back">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Draft — {visit.referenceNo}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Last updated: {formatDateTimeDDMMYYYY(visit.updatedAt)}</p>
                                </div>
                            </div>
                            <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm">
                                <CheckCircle className="w-4 h-4" /> Submit this Visit
                            </button>
                        </div>

                        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <span className="text-blue-500 text-lg mt-0.5">🔒</span>
                            <p className="text-sm text-blue-800">
                                Fields below are <strong>locked</strong> from your last save. Use the <span className="font-semibold text-amber-700">Add Additional Experts</span> section at the bottom of Section 2 to append new expert rows, then click <strong>Save Additions</strong>.
                            </p>
                        </div>

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

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {toast.message}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DraftsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    return id ? <DraftDetail id={id} /> : <DraftsList />;
}

export default function DraftsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
            <DraftsContent />
        </Suspense>
    );
}
