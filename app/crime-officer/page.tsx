'use client';

import FeatureCard from '@/components/cards/FeatureCard';
import { PageHeader, PageLayout } from '@/components/ui';
import { UserPlus, Users, Gear, MapPinLine } from 'phosphor-react';

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
        {
            title: 'User Management',
            subtitle: 'පරිශීලක කළමනාකරණය',
            description: 'View users by SOCO location, add new users and manage privileges.',
            href: '/crime-officer/user-management',
            icon: <Users className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
        },
        {
            title: 'User Configurations',
            subtitle: 'පරිශීලක වින්‍යාසයන්',
            description: 'Configure system-wide settings for user accounts.',
            href: '/crime-officer/user-configurations',
            icon: <Gear className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
        },
        {
            title: 'User Privilege Locations',
            subtitle: 'පරිශීලක වරප්‍රසාද ස්ථාන',
            description: 'Manage location-based access privileges for users.',
            href: '/crime-officer/user-privilege-locations',
            icon: <MapPinLine className="w-12 h-12" weight="fill" style={{ color: '#ef4444' }} />,
        },
    ];

    return (
        <PageLayout>
            <PageHeader
                title="Crime Officer Management"
                description="SOCO නිලධාරි කළමනාකරණ පද්ධතිය"
            />
            <section className="mb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
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
