'use client';

import { useState } from 'react';
import FeatureCard from '@/components/cards/FeatureCard';
import { PageHeader, PageLayout } from '@/components/ui';
import { Clipboard, FileText, MapPin } from 'phosphor-react';
import { CheckCircle, FileEdit, ListChecks, Scale, UserSearch, Gavel, Award } from 'lucide-react';

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
    {
      title: 'CVR Update Request',
      subtitle: 'CVR යාවත්කාලීන කිරීමට අවසර ඉල්ලීම',
      description: 'Request permission to amend a submitted CVR, then edit and send for re-approval.',
      icon: <FileEdit className="w-12 h-12" style={{ color: '#7c3aed' }} />,
      href: '/crime-visit-registry/cvr-update-request',
    },
    {
      title: 'Pending CVR Approvals',
      subtitle: 'අනුමැතිය බලාපොරොත්තු',
      description: 'Approve update requests and review amended records (changes highlighted in green).',
      icon: <ListChecks className="w-12 h-12" style={{ color: '#059669' }} />,
      href: '/crime-visit-registry/pending-cvr-approvals',
    },
    {
      title: 'Production sent to analysis institutes',
      subtitle: 'නිෂ්පාදන විශ්ලේෂණය',
      description:
        'Select a CVR visit and record analysis reports received (annex, date, result). Shown on submitted crime scenes.',
      icon: <UserSearch className="w-12 h-12" style={{ color: '#c2410c' }} />,
      href: '/crime-visit-registry/production-analysis',
    },
    {
      title: 'Court Details',
      subtitle: 'අධිකරණ තොරතුරු යාවත්කාලීන කිරීම',
      description:
        'Select a CVR visit: update production sent to court, record a court visit, or nominate court rewards.',
      icon: <Scale className="w-12 h-12" style={{ color: '#0e7490' }} />,
      href: '/crime-visit-registry/update-court-details',
    },
    {
      title: 'Court Visits',
      subtitle: 'අධිකරණ සංචාර',
      description:
        'Record officer court visits with testified officer, date, description, and attachments.',
      icon: <Gavel className="w-12 h-12" style={{ color: '#d946ef' }} />,
      href: '/crime-visit-registry/court-visits',
    },
    {
      title: 'Rewards',
      subtitle: 'අධිකරණ ත්‍යාග',
      description:
        'Nominate court rewards for Police, D/CRD, and Division categories.',
      icon: <Award className="w-12 h-12" style={{ color: '#14b8a6' }} />,
      href: '/crime-visit-registry/rewards',
    },
  ];

  return (
    <>
      <PageLayout>
        <PageHeader
          title="Crime Visit Registry"
          description="Manage scene-of-crime visits, officer assignments, and evidence examination records."
        />
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
      </PageLayout>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-green-600 text-white text-sm font-medium shadow-lg">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      ) : null}
    </>
  );
}
