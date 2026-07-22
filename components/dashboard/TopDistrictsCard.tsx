'use client';

import { BarChart3 } from 'lucide-react';
import { DISTRICT_CVR_DATA } from '@/lib/districtCvrData';
import { DISTRICT_COLORS, DEFAULT_DISTRICT_COLOR } from '@/lib/districtColors';

interface TopDistrictsCardProps {
  limit?: number;
}

export default function TopDistrictsCard({ limit = 6 }: TopDistrictsCardProps) {
  const topDistricts = Object.entries(DISTRICT_CVR_DATA)
    .map(([name, data]) => ({ name, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  const maxTotal = topDistricts[0]?.total ?? 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Top Districts</h2>
        <BarChart3 className="w-4 h-4 text-gray-300" />
      </div>
      <div className="space-y-3">
        {topDistricts.map((district, index) => {
          const color = DISTRICT_COLORS[district.name] ?? DEFAULT_DISTRICT_COLOR;
          const widthPercent = (district.total / maxTotal) * 100;
          return (
            <div key={district.name} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-400 w-4 flex-shrink-0">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">{district.name}</span>
                  <span className="text-sm font-bold text-gray-900 ml-2">{district.total.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: color.dark }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
