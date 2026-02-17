'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import {
  Gear,
  ClipboardText,
  PencilSimple,
  Users,
  Lock,
  MapPin,
  AddressBook,
  IdentificationCard,
  Key,
  Clock,
} from 'phosphor-react';

export default function ConfigPage() {
  const configurationCards = [
    {
      title: 'Category Type Management',
      icon: <Gear className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
      href: '/config/category-type',
    },
    {
      title: 'Category Assignment',
      icon: <ClipboardText className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
      href: '/config/category-assignment',
    },
    {
      title: 'Display Text Management',
      icon: <PencilSimple className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
      href: '/config/display-text',
    },
    {
      title: 'After Hour Management',
      icon: <Clock className="w-12 h-12" weight="fill" style={{ color: '#8b5cf6' }} />,
      href: '/config/after-hour',
    },
    {
      title: 'User Management',
      icon: <Users className="w-12 h-12" weight="fill" style={{ color: '#06b6d4' }} />,
      href: '/config/user',
    },
    {
      title: 'Privilege Management',
      icon: <Lock className="w-12 h-12" weight="fill" style={{ color: '#14b8a6' }} />,
      href: '/config/privilege',
    },
    {
      title: 'Location Management',
      icon: <MapPin className="w-12 h-12" weight="fill" style={{ color: '#ec4899' }} />,
      href: '/config/location',
    },
    {
      title: 'Contact Management',
      icon: <AddressBook className="w-12 h-12" weight="fill" style={{ color: '#ef4444' }} />,
      href: '/config/contact',
    },
    {
      title: 'Designation Management',
      icon: <IdentificationCard className="w-12 h-12" weight="fill" style={{ color: '#dc2626' }} />,
      href: '/config/designation',
    },
    {
      title: 'Change my password',
      icon: <Key className="w-12 h-12" weight="fill" style={{ color: '#f97316' }} />,
      href: '/config/change-password',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {configurationCards.map((card, index) => (
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

