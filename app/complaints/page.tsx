'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeatureCard from '@/components/cards/FeatureCard';
import {
  FileText,
  List,
  ClipboardText,
  DeviceMobile,
  Eye,
  User,
  PencilSimple,
  ArrowClockwise,
  MapPin,
} from 'phosphor-react';

export default function ComplaintsPage() {
  const complaintManagementCards = [
    {
      title: 'Lodge Complaint',
      icon: <FileText className="w-12 h-12" weight="fill" style={{ color: '#3b82f6' }} />,
      href: '/complaints/lodge',
    },
    {
      title: 'My Complaints',
      icon: <List className="w-12 h-12" weight="fill" style={{ color: '#10b981' }} />,
      href: '/complaints/my',
    },
    {
      title: 'My Assignments',
      icon: <ClipboardText className="w-12 h-12" weight="fill" style={{ color: '#f59e0b' }} />,
      href: '/complaints/assignments',
    },
    {
      title: 'Lost Phone Complaints',
      icon: <DeviceMobile className="w-12 h-12" weight="fill" style={{ color: '#8b5cf6' }} />,
      href: '/complaints/lost-phone',
    },
    {
      title: 'View Complaints',
      icon: <Eye className="w-12 h-12" weight="fill" style={{ color: '#06b6d4' }} />,
      href: '/complaints/view',
    },
    {
      title: 'Assigned Complaints',
      icon: <User className="w-12 h-12" weight="fill" style={{ color: '#14b8a6' }} />,
      href: '/complaints/assigned',
    },
    {
      title: 'Edit Complaints',
      icon: <PencilSimple className="w-12 h-12" weight="fill" style={{ color: '#ef4444' }} />,
      href: '/complaints/edit',
    },
    {
      title: 'Re-Activate Complaints',
      icon: <ArrowClockwise className="w-12 h-12" weight="fill" style={{ color: '#ec4899' }} />,
      href: '/complaints/reactivate',
    },
    {
      title: 'Police Locations',
      icon: <MapPin className="w-12 h-12" weight="fill" style={{ color: '#dc2626' }} />,
      href: '/complaints/locations',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Header />
      <div className="flex flex-1 relative z-10 w-full pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complaint Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {complaintManagementCards.map((card, index) => (
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

