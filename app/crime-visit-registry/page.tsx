'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import { Clipboard, FileText, List } from 'phosphor-react';

export default function CrimeVisitRegistryPage() {
    const cards = [
        {
            title: 'Initiate Crime Visit',
            icon: <Clipboard className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
            href: '/crime-visit-registry/initiate',
        },
        {
            title: 'Drafted Crime Visits',
            icon: <FileText className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
            href: '/crime-visit-registry/drafts',
        },
        {
            title: 'Crime Visits',
            icon: <List className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
            href: '/crime-visit-registry/crime-visits',
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crime Visit Registry</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Manage scene-of-crime visits, officer assignments, and evidence examination records.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
                                {cards.map((card, index) => (
                                    <FeatureCard
                                        key={index}
                                        title={card.title}
                                        icon={card.icon}
                                        href={card.href}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
