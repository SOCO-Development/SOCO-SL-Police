'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, PageLayout } from '@/components/ui';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import DashboardFilterBar, { type DashboardFilters } from '@/components/dashboard/DashboardFilterBar';
import KpiCard from '@/components/dashboard/KpiCard';
import DistrictMap from '@/components/dashboard/DistrictMap';
import CrimeCategoriesSidebarCard from '@/components/dashboard/CrimeCategoriesSidebarCard';
import TopDistrictsCard from '@/components/dashboard/TopDistrictsCard';
import { DISTRICT_CVR_DATA } from '@/lib/districtCvrData';

const TOTAL_CVRS = Object.values(DISTRICT_CVR_DATA).reduce((sum, d) => sum + d.total, 0);
const PENDING_CVRS = Object.values(DISTRICT_CVR_DATA).reduce((sum, d) => sum + d.pending, 0);
const APPROVED_CVRS = Object.values(DISTRICT_CVR_DATA).reduce((sum, d) => sum + d.approved, 0);
const REJECTED_CVRS = Object.values(DISTRICT_CVR_DATA).reduce((sum, d) => sum + d.rejected, 0);

export default function DashboardPage() {
  const handleViewFilters = (filters: DashboardFilters) => {
    console.log('Dashboard filters applied', filters);
  };

  // Sample data for CVR Activity (monthly)
  const activityData = [
    { month: 'Jan', total: 1820, approved: 1450, pending: 280 },
    { month: 'Feb', total: 2050, approved: 1640, pending: 310 },
    { month: 'Mar', total: 2280, approved: 1820, pending: 340 },
    { month: 'Apr', total: 2150, approved: 1720, pending: 320 },
    { month: 'May', total: 2400, approved: 1920, pending: 350 },
    { month: 'Jun', total: 2600, approved: 2080, pending: 370 },
    { month: 'Jul', total: 2490, approved: 1990, pending: 365 },
    { month: 'Aug', total: 2750, approved: 2200, pending: 390 },
    { month: 'Sep', total: 2900, approved: 2320, pending: 410 },
    { month: 'Oct', total: 3150, approved: 2520, pending: 430 },
    { month: 'Nov', total: 3050, approved: 2440, pending: 420 },
    { month: 'Dec', total: 3300, approved: 2640, pending: 450 },
  ];

  const maxActivityValue = Math.ceil(Math.max(...activityData.map((d) => d.total)) / 900) * 900;
  const activityYAxisTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxActivityValue / 4) * i));

  return (
    <PageLayout contentClassName="py-8">
      <PageHeader backHref="/reports" title="360 Dashboard" />

      <DashboardFilterBar onView={handleViewFilters} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total CVRs" value={TOTAL_CVRS} icon={FileText} tone="blue" progressPercent={100} />
        <KpiCard label="Pending CVRs" value={PENDING_CVRS} icon={Clock} tone="yellow" progressPercent={(PENDING_CVRS / TOTAL_CVRS) * 100} />
        <KpiCard label="Approved CVRs" value={APPROVED_CVRS} icon={CheckCircle2} tone="green" progressPercent={(APPROVED_CVRS / TOTAL_CVRS) * 100} />
        <KpiCard label="Rejected CVRs" value={REJECTED_CVRS} icon={XCircle} tone="red" progressPercent={(REJECTED_CVRS / TOTAL_CVRS) * 100} />
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 items-start">
        <div className="xl:col-span-2">
          <DistrictMap />
        </div>
        <div className="flex flex-col gap-6">
          <CrimeCategoriesSidebarCard />
          <TopDistrictsCard />
        </div>
      </div>

      {/* CVR Activity Chart - Full Width */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">CVR Activity — 2025</h2>
            <p className="text-xs text-gray-400">Monthly crime verification report submissions</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-600">Total CVRs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-gray-600">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-gray-600">Pending</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={activityData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
            <YAxis domain={[0, maxActivityValue]} ticks={activityYAxisTicks} tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
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
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorTotal)" name="Total CVRs" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} fill="none" name="Approved" dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="pending" stroke="#eab308" strokeWidth={2} fill="none" name="Pending" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PageLayout>
  );
}
