'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitList from '@/components/layout/crime-visit/CrimeVisitList';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisit } from '@/types/crimeVisit';
import { ArrowLeft, Plus } from 'lucide-react';

export default function DraftedCrimeVisitsPage() {
    const [drafts, setDrafts] = useState<CrimeVisit[]>([]);

    function loadDrafts() {
        setDrafts(crimeVisitService.getDrafts());
    }

    useEffect(() => {
        loadDrafts();
    }, []);

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
                        {/* Page header */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/crime-visit-registry"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Drafted Crime Visits</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {drafts.length} draft{drafts.length !== 1 ? 's' : ''} — click <strong>Continue</strong> to append more details.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/crime-visit-registry/initiate"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> New Visit
                            </Link>
                        </div>

                        {/* Info banner for append-only semantics */}
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
