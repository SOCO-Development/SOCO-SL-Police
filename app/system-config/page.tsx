'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import { MapPin, Truck, UserGear, ListBullets } from 'phosphor-react';

export default function SystemConfigPage() {
    const cards = [
        {
            title: 'Location Configuration',
            subtitle: 'ස්ථාන වින්‍යාස කිරීම',
            description: 'Manage districts, divisions and station locations used across the system.',
            href: '/system-config/location',
            icon: <MapPin className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
        },
        {
            title: 'Vehicle Configuration',
            subtitle: 'වාහන වින්‍යාස කිරීම',
            description: 'Configure and manage vehicles assigned to SOCO operations.',
            href: '/system-config/vehicle',
            icon: <Truck className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
        },
        {
            title: 'User Configuration',
            subtitle: 'පරිශීලක වින්‍යාස කිරීම',
            description: 'Manage system users, roles and access permissions.',
            href: '/system-config/user',
            icon: <UserGear className="w-12 h-12" weight="fill" style={{ color: '#8b5cf6' }} />,
        },
        {
            title: 'LOV Management',
            subtitle: 'LOV කළමනාකරණය',
            description: 'Manage list-of-values used in dropdowns and form selections system-wide.',
            href: '/system-config/lov-management',
            icon: <ListBullets className="w-12 h-12" weight="bold" style={{ color: '#ef4444' }} />,
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
                                Configuration
                            </h2>
                            <p className="text-sm text-gray-500 mb-8 font-noto-sinhala">
                                පද්ධති වින්‍යාස කළමනාකරණය
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-3xl lg:max-w-none">
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
