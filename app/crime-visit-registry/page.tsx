'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import { Clipboard, FileText, List, MapPin } from 'phosphor-react';
import { CheckCircle } from 'lucide-react';

export default function CrimeVisitRegistryPage() {
    const [toast, setToast] = useState<string>('');

    function showToast(message: string) {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    }

    const cards = [
        {
            title: 'Initiate Visit',
            subtitle: 'අපරාධ ස්ථාන නිරීක්ෂණය ආරම්භ කරන්න',
            description: 'Start a new scene-of-crime visit record and assign officers.',
            icon: <Clipboard className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
            href: '/crime-visit-registry/initiate',
        },

        {
            title: 'Crime Visits',
            subtitle: 'අපරාධ ස්ථාන නිරීක්ෂණ ලැයිස්තුව',
            description: 'Browse and manage all completed crime visit entries.',
            icon: <List className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
            href: '/crime-visit-registry/crime-visits',
        },
        {
            title: 'Create Crime Scene',
            subtitle: 'අපරාධ ස්ථාන තොරතුරු එකතු කරන්න',
            description: 'Add one or more crime scenes under a started visit and save with CVR.',
            icon: <MapPin className="w-12 h-12" weight="fill" style={{ color: '#ef4444' }} />,
            href: '/crime-visit-registry/create-scene',
        },
        {
            title: 'Submitted Crime Scenes',
            subtitle: 'යවන ලද අපරාධ ස්ථාන වාර්තා',
            description: 'View all crime scenes that have been saved under CVR numbers.',
            icon: <FileText className="w-12 h-12" weight="fill" style={{ color: '#0891b2' }} />,
            href: '/crime-visit-registry/submitted-crime-scenes',
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {cards.map((card) => (
                                    <FeatureCard
                                        key={card.href ?? card.title}
                                        title={card.title}
                                        icon={card.icon}
                                        href={card.href}
                                        subtitle={<span className="font-noto-sinhala">{card.subtitle}</span>}
                                        description={card.description}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                    <Footer />
                </main>
            </div>

            {toast ? (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    {toast}
                </div>
            ) : null}
        </div>
    );
}