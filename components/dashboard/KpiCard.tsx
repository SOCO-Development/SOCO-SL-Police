'use client';

import type { LucideIcon } from 'lucide-react';
import CountUpNumber from '@/components/dashboard/CountUpNumber';

type KpiTone = 'blue' | 'yellow' | 'green' | 'red';

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: KpiTone;
  progressPercent: number;
}

const TONE_STYLES: Record<KpiTone, { iconBg: string; iconColor: string; valueColor: string; barColor: string }> = {
  blue: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
    barColor: 'bg-blue-500',
  },
  yellow: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    valueColor: 'text-yellow-700',
    barColor: 'bg-yellow-500',
  },
  green: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    valueColor: 'text-green-700',
    barColor: 'bg-green-500',
  },
  red: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-700',
    barColor: 'bg-red-500',
  },
};

export default function KpiCard({ label, value, icon: Icon, tone, progressPercent }: KpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>
          <Icon className={`w-4 h-4 ${styles.iconColor}`} />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-extrabold ${styles.valueColor} leading-none mb-3`}>
        <CountUpNumber value={value} />
      </p>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${styles.barColor} rounded-full`} style={{ width: `${Math.min(100, progressPercent)}%` }} />
      </div>
    </div>
  );
}
