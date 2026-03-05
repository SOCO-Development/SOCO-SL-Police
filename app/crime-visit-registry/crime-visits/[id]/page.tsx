'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitDetailView from '@/components/layout/crime-visit/CrimeVisitDetailView';
import { crimeVisitService } from '@/lib/crimeVisitService';
import { formatDateTimeDDMMYYYY } from '@/lib/dateUtils';
import type { CrimeVisit } from '@/types/crimeVisit';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';

interface Props {
    params: Promise<{ id: string }>;
}

export default function CrimeVisitDetailPage({ params }: Props) {
    const [visit, setVisit] = useState<CrimeVisit | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(({ id }) => {
            const found = crimeVisitService.getById(id);
            setVisit(found ?? null);
            setLoading(false);
        });
    }, [params]);

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
                <p className="text-lg font-semibold">Record not found.</p>
                <Link href="/crime-visit-registry/crime-visits" className="text-sm text-blue-600 hover:underline">
                    ← Back to Crime Visits
                </Link>
            </div>
        );
    }

    // Route drafts to draft detail page
    if (visit.status === 'DRAFT') {
        window.location.href = `/crime-visit-registry/drafts/${visit.id}`;
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        {/* Page header */}
                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                            <Link
                                href="/crime-visit-registry/crime-visits"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl font-bold text-gray-900">{visit.referenceNo}</h2>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                        <CheckCircle className="w-3 h-3" />
                                        Submitted
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Submitted: {formatDateTimeDDMMYYYY(visit.updatedAt)}
                                </p>
                            </div>
                        </div>

                        {/* Read-only banner */}
                        <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-800">
                                This crime visit has been <strong>submitted</strong> and is now read-only.
                            </p>
                        </div>

                        <CrimeVisitDetailView visit={visit} />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
