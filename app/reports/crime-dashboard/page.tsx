'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, PageLayout } from '@/components/ui';
import { ShieldAlert, ShieldCheck, Siren, Gavel } from 'lucide-react';
import CrimeDashboardFilterBar, { type CrimeDashboardFilters } from '@/components/dashboard/CrimeDashboardFilterBar';
import KpiCard from '@/components/dashboard/KpiCard';
import CrimeCategorizationChart from '@/components/dashboard/CrimeCategorizationChart';

const TOTAL_CRIMES = 850;
const SOLVED_CRIMES = 527;
const UNDER_INVESTIGATION = 238;
const OPEN_CASES = 85;

export default function CrimeDashboardPage() {
  const handleViewFilters = (filters: CrimeDashboardFilters) => {
    console.log('Crime dashboard filters applied', filters);
  };

  // Sample data for Crime Location Distribution
  const locationData = [
    { name: 'Achchuweli', open: 12, solved: 38, underInvestigation: 20 },
    { name: 'Badulla', open: 18, solved: 65, underInvestigation: 30 },
    { name: 'Jaffna', open: 25, solved: 90, underInvestigation: 45 },
    { name: 'Kurunegala Division', open: 30, solved: 120, underInvestigation: 60 },
    { name: 'Mullaitivu Division', open: 15, solved: 55, underInvestigation: 25 },
    { name: 'Colombo', open: 40, solved: 180, underInvestigation: 80 },
    { name: 'Gampaha', open: 35, solved: 150, underInvestigation: 70 },
    { name: 'Kalutara', open: 28, solved: 140, underInvestigation: 55 },
    { name: 'Kandy', open: 22, solved: 110, underInvestigation: 48 },
    { name: 'Matara', open: 20, solved: 100, underInvestigation: 42 },
  ];

  const getMaxValue = (data: typeof locationData) => {
    let max = 0;
    data.forEach((item) => {
      const total = item.open + item.solved + item.underInvestigation;
      if (total > max) max = total;
    });
    return Math.ceil(max / 50) * 50;
  };

  const maxYValue = getMaxValue(locationData);
  const yAxisTicks = Array.from({ length: Math.ceil(maxYValue / 50) + 1 }, (_, i) => i * 50);

  return (
    <PageLayout contentClassName="py-8">
      <PageHeader backHref="/reports" title="Crime Dashboard" />

      <CrimeDashboardFilterBar onView={handleViewFilters} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Crimes" value={TOTAL_CRIMES} icon={Siren} tone="blue" progressPercent={100} />
        <KpiCard label="Solved Crimes" value={SOLVED_CRIMES} icon={ShieldCheck} tone="green" progressPercent={(SOLVED_CRIMES / TOTAL_CRIMES) * 100} />
        <KpiCard label="Under Investigation" value={UNDER_INVESTIGATION} icon={ShieldAlert} tone="yellow" progressPercent={(UNDER_INVESTIGATION / TOTAL_CRIMES) * 100} />
        <KpiCard label="Open Cases" value={OPEN_CASES} icon={Gavel} tone="red" progressPercent={(OPEN_CASES / TOTAL_CRIMES) * 100} />
      </div>

      {/* Charts Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crime Location Distribution Chart */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Crime Location Distribution</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#c41e3a' }}></div>
                <span className="text-gray-600">Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28a745' }}></div>
                <span className="text-gray-600">Solved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f0ad4e' }}></div>
                <span className="text-gray-600">Under Investigation</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={locationData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1} vertical={false} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={0}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                domain={[0, maxYValue]}
                ticks={yAxisTicks}
                stroke="#9ca3af"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 backdrop-blur-md p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-semibold">{Number(entry.value).toLocaleString()}</span>
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="open" fill="#c41e3a" name="Open" radius={[4, 4, 0, 0]} />
              <Bar dataKey="solved" fill="#28a745" name="Solved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="underInvestigation" fill="#f0ad4e" name="Under Investigation" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crime Categorization Chart */}
        <CrimeCategorizationChart />
      </div>
    </PageLayout>
  );
}
