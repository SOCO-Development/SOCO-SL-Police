'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import { UserPlus, Users } from 'phosphor-react';

export default function CrimeOfficerPage() {
    const cards = [
        {
            title: 'Add Officer',
            subtitle: 'නිලධාරි එකතු කරන්න',
            description: 'Register a new SOCO officer with full personnel details.',
            href: '/crime-officer/add',
            icon: <UserPlus className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
        },
        {
            title: 'View Officers',
            subtitle: 'නිලධාරීන් බලන්න',
            description: 'Browse, search and manage all registered SOCO officers.',
            href: '/crime-officer/view',
            icon: <Users className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Crime Officer Management
                            </h2>
                            <p className="text-sm text-gray-500 mb-8 font-noto-sinhala">
                                SOCO නිලධාරි කළමනාකරණ පද්ධතිය
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {cards.map((card) => (
                                    <FeatureCard
                                        key={card.href}
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
        </div>
    );
}
