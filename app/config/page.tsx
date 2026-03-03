'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import { IdentificationCard } from 'phosphor-react';

export default function ConfigPage() {
  const configurationCards = [
    {
      title: 'Crime Officer Management',
      icon: <IdentificationCard className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
      href: '/config/crime-officer',
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

