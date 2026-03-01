'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CrimeVisitList from '@/components/layout/CrimeVisitList';
import { crimeVisitService } from '@/lib/crimeVisitService';
import type { CrimeVisit, CrimeVisitStatus } from '@/types/crimeVisit';
import { ArrowLeft, Plus } from 'lucide-react';

type FilterTab = 'ALL' | CrimeVisitStatus;

const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Submitted', value: 'SUBMITTED' },
];

export default function AllCrimeVisitsPage() {
    const [all, setAll] = useState<CrimeVisit[]>([]);
    const [filter, setFilter] = useState<FilterTab>('ALL');

    function load() {
        setAll(crimeVisitService.getAll());
    }

    useEffect(() => {
        load();
    }, []);

    const visible = filter === 'ALL' ? all : all.filter((v) => v.status === filter);

    const countFor = (tab: FilterTab) =>
        tab === 'ALL' ? all.length : all.filter((v) => v.status === tab).length;

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
                                    href="/crime-visit-registry"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Crime Visits</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        All crime visit records — draft and submitted.
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

                        {/* Filter tabs */}
                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setFilter(tab.value)}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${filter === tab.value
                                            ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label}
                                    <span
                                        className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${filter === tab.value
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {countFor(tab.value)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <CrimeVisitList
                            visits={visible}
                            showStatusBadge
                            emptyMessage="No crime visits found for this filter."
                        />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
