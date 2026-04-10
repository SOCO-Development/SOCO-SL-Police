'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import {
  ChartLine,
  ChartBar,
  User,
  ClipboardText,
  FileText,
  DeviceMobile,
  SquaresFour,
} from 'phosphor-react';

export default function ReportsPage() {
  const reportsCards = [
    {
      title: '360 - Dashboard',
      icon: <SquaresFour className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
      href: '/reports/dashboard',
    },
    {
      title: 'Report & Data',
      icon: <ChartLine className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
      href: '/reports/data',
    },
    {
      title: 'Officer Stats.',
      icon: <User className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
      href: '/reports/officer-stats',
    },
    {
      title: 'Main Complaint Stats.',
      icon: <ChartBar className="w-12 h-12" weight="fill" style={{ color: '#8b5cf6' }} />,
      href: '/reports/complaint-stats',
    },
    {
      title: 'Forward count',
      icon: <ClipboardText className="w-12 h-12" weight="fill" style={{ color: '#06b6d4' }} />,
      href: '/reports/forward-count',
    },
    {
      title: 'Complaint Report',
      icon: <FileText className="w-12 h-12" weight="fill" style={{ color: '#14b8a6' }} />,
      href: '/reports/complaint-report',
    },
    {
      title: 'Lost Phone Management',
      icon: <DeviceMobile className="w-12 h-12" weight="fill" style={{ color: '#ec4899' }} />,
      href: '/reports/lost-phone',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports and Dashboards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {reportsCards.map((card, index) => (
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

