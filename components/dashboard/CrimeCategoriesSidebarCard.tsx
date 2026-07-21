'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CRIME_CATEGORY_DATA, type CrimeCategoryDatum } from '@/lib/crimeCategories';
import CrimeCategoryDetailModal from '@/components/modals/CrimeCategoryDetailModal';
import CountUpNumber from '@/components/dashboard/CountUpNumber';

export default function CrimeCategoriesSidebarCard() {
  const [selectedCategory, setSelectedCategory] = useState<CrimeCategoryDatum | null>(null);
  const totalCrimes = CRIME_CATEGORY_DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-900">Crime Categories</h2>
        <PieChartIcon className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-xs text-gray-400 mb-4">Distribution by offense type</p>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg p-3 mb-4 text-center">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Total Crimes</p>
        <p className="text-2xl font-extrabold text-gray-900">
          <CountUpNumber value={totalCrimes} />
        </p>
      </div>

      <div className="flex justify-center mb-4">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie
              data={CRIME_CATEGORY_DATA}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={68}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              onClick={(entry) => setSelectedCategory(entry as unknown as CrimeCategoryDatum)}
              className="cursor-pointer"
            >
              {CRIME_CATEGORY_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} className="cursor-pointer" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  const percentage = ((data.value as number / totalCrimes) * 100).toFixed(1);
                  return (
                    <div className="bg-white/95 backdrop-blur-md p-2 border border-gray-200 rounded-lg shadow-lg text-xs">
                      <p className="font-semibold text-gray-900">{data.name}</p>
                      <p className="text-gray-600">{data.value?.toLocaleString()} ({percentage}%)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {CRIME_CATEGORY_DATA.map((item, index) => {
          const percentage = (item.value / totalCrimes) * 100;
          return (
            <button
              key={index}
              onClick={() => setSelectedCategory(item)}
              className="w-full flex items-center gap-2 group"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="text-xs text-gray-600 flex-1 text-left truncate group-hover:text-gray-900">{item.name}</span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.fill }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-10 text-right">{percentage.toFixed(0)}%</span>
            </button>
          );
        })}
      </div>

      <CrimeCategoryDetailModal
        category={selectedCategory}
        totalCount={totalCrimes}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
