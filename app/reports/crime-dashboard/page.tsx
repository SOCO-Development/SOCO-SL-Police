'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, PageLayout } from '@/components/ui';
import { ShieldAlert, ShieldCheck, Siren, Gavel } from 'lucide-react';
import CrimeDashboardFilterBar, { type CrimeDashboardFilters } from '@/components/dashboard/CrimeDashboardFilterBar';
import CrimeCategorizationChart from '@/components/dashboard/CrimeCategorizationChart';

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
    <PageLayout contentClassName="py-10">
      <PageHeader backHref="/reports" title="Crime Dashboard" />

      <CrimeDashboardFilterBar onView={handleViewFilters} />

      {/* Main Content Area */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-8 relative z-0">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* TOTAL CRIMES */}
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl p-6 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md flex-shrink-0">
                <Siren className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">TOTAL CRIMES</p>
                <p className="text-5xl font-extrabold text-blue-700 leading-none mb-1">850</p>
                <p className="text-sm font-semibold text-blue-600">Live</p>
              </div>
            </div>
            <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* SOLVED CRIMES */}
          <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-xl p-6 shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">SOLVED CRIMES</p>
                <p className="text-5xl font-extrabold text-green-700 leading-none mb-1">527</p>
                <p className="text-sm font-semibold text-green-600">(62.0%)</p>
              </div>
            </div>
            <div className="h-1 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '62%' }}></div>
            </div>
          </div>

          {/* UNDER INVESTIGATION */}
          <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-xl p-6 shadow-lg border border-yellow-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md flex-shrink-0">
                <ShieldAlert className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">UNDER INVESTIGATION</p>
                <p className="text-5xl font-extrabold text-yellow-700 leading-none mb-1">238</p>
                <p className="text-sm font-semibold text-yellow-600">(28.0%)</p>
              </div>
            </div>
            <div className="h-1 bg-yellow-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>

          {/* OPEN CASES */}
          <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 rounded-xl p-6 shadow-lg border border-red-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md flex-shrink-0">
                <Gavel className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">OPEN CASES</p>
                <p className="text-5xl font-extrabold text-red-700 leading-none mb-1">85</p>
                <p className="text-sm font-semibold text-red-600">(10.0%)</p>
              </div>
            </div>
            <div className="h-1 bg-red-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>

        {/* Charts Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Crime Location Distribution Chart */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Crime Location Distribution</h2>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c41e3a' }}></div>
                  <span className="text-gray-600">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#28a745' }}></div>
                  <span className="text-gray-600">Solved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f0ad4e' }}></div>
                  <span className="text-gray-600">Under Investigation</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={locationData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" strokeWidth={1} opacity={0.7} />
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
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: '600' } }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  domain={[0, maxYValue]}
                  ticks={yAxisTicks}
                  stroke="#9ca3af"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 backdrop-blur-md p-3 border border-gray-200 rounded-lg shadow-lg">
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
      </div>
    </PageLayout>
  );
}
