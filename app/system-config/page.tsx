'use client';

import FeatureCard from '@/components/cards/FeatureCard';
import { PageHeader, PageLayout } from '@/components/ui';
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
        <PageLayout>
            <PageHeader
                title="Configuration"
                description="පද්ධති වින්‍යාස කළමනාකරණය"
            />
            <section className="mb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-3xl lg:max-w-none">
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
        </PageLayout>
    );
}
