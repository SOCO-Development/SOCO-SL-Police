'use client';

import FeatureCard from '@/components/cards/FeatureCard';
import { PageHeader, PageLayout } from '@/components/ui';
import {
  ChartLine,
  ChartBar,
  User,
  ClipboardText,
  FileText,
  DeviceMobile,
  SquaresFour,
  ShieldWarning,
  Users,
} from 'phosphor-react';

export default function ReportsPage() {
  const reportsCards = [
    {
      title: '360 - Dashboard',
      icon: <SquaresFour className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
      href: '/reports/dashboard',
    },
    {
      title: 'Crime Dashboard',
      icon: <ShieldWarning className="w-12 h-12" weight="fill" style={{ color: '#c41e3a' }} />,
      href: '/reports/crime-dashboard',
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
    {
      title: 'User Management',
      icon: <Users className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
      href: '/crime-officer/user-management',
    },
  ];

  return (
    <PageLayout>
      <PageHeader title="Reports and Dashboards" />
      <section className="mb-12">
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
    </PageLayout>
  );
}
