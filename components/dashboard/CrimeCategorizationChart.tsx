'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CRIME_CATEGORY_DATA, type CrimeCategoryDatum } from '@/lib/crimeCategories';
import CrimeCategoryDetailModal from '@/components/modals/CrimeCategoryDetailModal';

interface CrimeCategorizationChartProps {
  title?: string;
}

export default function CrimeCategorizationChart({ title = 'Crime Categorization' }: CrimeCategorizationChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<CrimeCategoryDatum | null>(null);
  const totalCrimes = CRIME_CATEGORY_DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0 flex flex-col">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Crimes</p>
            <p className="text-2xl font-bold text-gray-900">{totalCrimes.toLocaleString()}</p>
          </div>
          <ResponsiveContainer width={280} height={280}>
            <PieChart>
              <Pie
                data={CRIME_CATEGORY_DATA}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                onClick={(entry) => setSelectedCategory(entry as unknown as CrimeCategoryDatum)}
                className="cursor-pointer"
              >
                {CRIME_CATEGORY_DATA.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="#fff"
                    strokeWidth={2.5}
                    className="cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 9999 }}
                contentStyle={{ zIndex: 9999 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const percentage = ((data.value as number / totalCrimes) * 100).toFixed(1);
                    return (
                      <div className="bg-white/90 backdrop-blur-md p-2.5 border border-gray-300 rounded-lg shadow-xl" style={{ pointerEvents: 'none', zIndex: 9999 }}>
                        <p className="text-xs font-semibold text-gray-900 mb-1">{data.name}</p>
                        <p className="text-xs text-gray-700">
                          <span className="font-bold">{data.value?.toLocaleString()}</span> ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0">
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            {CRIME_CATEGORY_DATA.map((item, index) => {
              const percentage = ((item.value / totalCrimes) * 100).toFixed(1);
              return (
                <div
                  key={index}
                  onClick={() => setSelectedCategory(item)}
                  className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  title={`${item.name}: ${item.value.toLocaleString()} (${percentage}%)`}
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 font-medium truncate group-hover:text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-900">{item.value.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CrimeCategoryDetailModal
        category={selectedCategory}
        totalCount={totalCrimes}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
