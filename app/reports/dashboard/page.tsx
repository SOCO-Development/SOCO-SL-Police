'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PageHeader, PageLayout } from '@/components/ui';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import DashboardFilterBar, { type DashboardFilters } from '@/components/dashboard/DashboardFilterBar';
import CrimeCategorizationChart from '@/components/dashboard/CrimeCategorizationChart';

export default function DashboardPage() {
  const handleViewFilters = (filters: DashboardFilters) => {
    console.log('Dashboard filters applied', filters);
  };

  // Sample data for Location Distribution
  const locationData = [
    { name: 'Achchuweli', rejected: 50, completed: 150, pending: 200 },
    { name: 'Badulla', rejected: 80, completed: 250, pending: 300 },
    { name: 'Jaffna', rejected: 120, completed: 400, pending: 500 },
    { name: 'Kurunegala Division', rejected: 150, completed: 600, pending: 800 },
    { name: 'Mullaitivu Division', rejected: 100, completed: 350, pending: 450 },
    { name: 'Colombo', rejected: 200, completed: 800, pending: 1000 },
    { name: 'Gampaha', rejected: 180, completed: 700, pending: 900 },
    { name: 'Kalutara', rejected: 220, completed: 900, pending: 1000 },
    { name: 'Kandy', rejected: 160, completed: 650, pending: 850 },
    { name: 'Matara', rejected: 190, completed: 750, pending: 950 },
  ];

  // Sample data for Timely Distribution
  const timelyData = [
    { date: '01-12-2025', requests: 2500 },
    { date: '02-12-2025', requests: 3200 },
    { date: '03-12-2025', requests: 3100 },
    { date: '04-12-2025', requests: 3400 },
    { date: '05-12-2025', requests: 3300 },
    { date: '06-12-2025', requests: 3500 },
    { date: '07-12-2025', requests: 3200 },
    { date: '08-12-2025', requests: 3600 },
    { date: '09-12-2025', requests: 3400 },
    { date: '10-12-2025', requests: 3300 },
    { date: '11-12-2025', requests: 3700 },
    { date: '12-12-2025', requests: 3500 },
    { date: '13-12-2025', requests: 3800 },
    { date: '14-12-2025', requests: 3600 },
    { date: '15-12-2025', requests: 3400 },
    { date: '16-12-2025', requests: 3900 },
    { date: '17-12-2025', requests: 3700 },
    { date: '18-12-2025', requests: 3500 },
    { date: '19-12-2025', requests: 3300 },
    { date: '20-12-2025', requests: 3200 },
    { date: '19-12-2025', requests: 3300 },
    { date: '20-12-2025', requests: 3200 },
    { date: '21-12-2025', requests: 2800 },
    { date: '22-12-2025', requests: 2600 },
    { date: '23-12-2025', requests: 2400 },
    { date: '24-12-2025', requests: 2200 },
    { date: '25-12-2025', requests: 2100 },
    { date: '26-12-2025', requests: 2300 },
    { date: '27-12-2025', requests: 2500 },
    { date: '28-12-2025', requests: 2700 },
    { date: '29-12-2025', requests: 2900 },
    { date: '30-12-2025', requests: 3100 },
    { date: '31-12-2025', requests: 2800 },
    { date: '01-01-2026', requests: 2500 },
    { date: '02-01-2026', requests: 2700 },
    { date: '03-01-2026', requests: 3000 },
    { date: '04-01-2026', requests: 3200 },    
    { date: '19-12-2025', requests: 3300 },
    { date: '20-12-2025', requests: 3200 },
    { date: '21-12-2025', requests: 2800 },
    { date: '22-12-2025', requests: 2600 },
    { date: '23-12-2025', requests: 2400 },
    { date: '24-12-2025', requests: 2200 },
    { date: '25-12-2025', requests: 2100 },
    { date: '26-12-2025', requests: 2300 },
    { date: '27-12-2025', requests: 2500 },
    { date: '28-12-2025', requests: 2700 },
    { date: '29-12-2025', requests: 2900 },
    { date: '30-12-2025', requests: 3100 },
    { date: '31-12-2025', requests: 2800 },
    { date: '01-01-2026', requests: 2500 },
    { date: '02-01-2026', requests: 2700 },
    { date: '03-01-2026', requests: 3000 },
    { date: '28-12-2025', requests: 2700 },
    { date: '29-12-2025', requests: 2900 },
    { date: '30-12-2025', requests: 3100 },
    { date: '31-12-2025', requests: 2800 },
    { date: '01-01-2026', requests: 2500 },
    { date: '02-01-2026', requests: 2700 },
    { date: '03-01-2026', requests: 3000 },
    { date: '04-01-2026', requests: 3200 },
    { date: '21-12-2025', requests: 2800 },
    { date: '23-12-2025', requests: 2400 },
    { date: '24-12-2025', requests: 2200 },
    { date: '25-12-2025', requests: 2100 },
    { date: '26-12-2025', requests: 2300 },
    { date: '27-12-2025', requests: 2500 },
    { date: '28-12-2025', requests: 2700 },
    { date: '29-12-2025', requests: 2900 },
    { date: '30-12-2025', requests: 3100 },
    { date: '31-12-2025', requests: 2800 },
    { date: '01-01-2026', requests: 2500 },
    { date: '02-01-2026', requests: 2700 },
    { date: '03-01-2026', requests: 3000 },
    { date: '04-01-2026', requests: 3200 },
    { date: '05-01-2026', requests: 3400 },
    { date: '06-01-2026', requests: 3600 },
    { date: '07-01-2026', requests: 3800 },
    { date: '08-01-2026', requests: 3600 },
  ];

  // Calculate max value for Y-axis based on Location Distribution data
  const getMaxValue = (data: typeof locationData) => {
    let max = 0;
    data.forEach(item => {
      const total = item.rejected + item.completed + item.pending;
      if (total > max) max = total;
    });
    // Round up to nearest 100 for better visualization
    return Math.ceil(max / 100) * 100;
  };

  // Calculate max value for Y-axis based on Timely Distribution data
  const getMaxTimelyValue = (data: typeof timelyData) => {
    let max = 0;
    data.forEach(item => {
      if (item.requests > max) max = item.requests;
    });
    // Round up to nearest 500 for better visualization
    return Math.ceil(max / 500) * 500;
  };

  const maxYValue = getMaxValue(locationData);
  const yAxisTicks = Array.from({ length: Math.ceil(maxYValue / 100) + 1 }, (_, i) => i * 100);

  const maxTimelyYValue = getMaxTimelyValue(timelyData);
  const timelyYAxisTicks = Array.from({ length: Math.ceil(maxTimelyYValue / 500) + 1 }, (_, i) => i * 500);

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageLayout contentClassName="py-10">
      <PageHeader backHref="/reports" title="360 Dashboard" />

      <DashboardFilterBar onView={handleViewFilters} />

            {/* Main Content Area */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-8 relative z-0">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* TOTAL CVRs */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl p-6 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md flex-shrink-0">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">TOTAL CVRs</p>
                      <p className="text-5xl font-extrabold text-blue-700 leading-none mb-1">1,245</p>
                      <p className="text-sm font-semibold text-blue-600">Live</p>
                    </div>
                  </div>
                  <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* PENDING CVRs */}
                <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-xl p-6 shadow-lg border border-yellow-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md flex-shrink-0">
                      <Clock className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">PENDING CVRs</p>
                      <p className="text-5xl font-extrabold text-yellow-700 leading-none mb-1">312</p>
                      <p className="text-sm font-semibold text-yellow-600">(25.1%)</p>
                    </div>
                  </div>
                  <div className="h-1 bg-yellow-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" style={{ width: '25.1%' }}></div>
                  </div>
                </div>

                {/* APPROVED CVRs */}
                <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-xl p-6 shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md flex-shrink-0">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">APPROVED CVRs</p>
                      <p className="text-5xl font-extrabold text-green-700 leading-none mb-1">928</p>
                      <p className="text-sm font-semibold text-green-600">(74.5%)</p>
                    </div>
                  </div>
                  <div className="h-1 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '74.5%' }}></div>
                  </div>
                </div>

                {/* REJECTED CVRs */}
                <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 rounded-xl p-6 shadow-lg border border-red-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md flex-shrink-0">
                      <XCircle className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">REJECTED CVRs</p>
                      <p className="text-5xl font-extrabold text-red-700 leading-none mb-1">5</p>
                      <p className="text-sm font-semibold text-red-600">(0.4%)</p>
                    </div>
                  </div>
                  <div className="h-1 bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: '0.4%' }}></div>
                  </div>
                </div>
              </div>

              {/* Charts Section - Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Location Distribution Chart */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Location Distribution</h2>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c41e3a' }}></div>
                        <span className="text-gray-600">Rejected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#28a745' }}></div>
                        <span className="text-gray-600">Approved</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f0ad4e' }}></div>
                        <span className="text-gray-600">Pending</span>
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
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rejected" fill="#c41e3a" name="Rejected" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="#28a745" name="Approved" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill="#f0ad4e" name="Pending" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                <CrimeCategorizationChart />
                  </div>

              {/* Timely Distribution Chart - Full Width */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Timely Distribution</h2>
                <ResponsiveContainer width="100%" height={480}>
                  <AreaChart data={timelyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                        <stop offset="20%" stopColor="#f97316" stopOpacity={0.7}/>
                        <stop offset="50%" stopColor="#fb923c" stopOpacity={0.5}/>
                        <stop offset="80%" stopColor="#60a5fa" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" strokeWidth={1} opacity={0.8} />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={90}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      interval={2}
                      stroke="#9ca3af"
                      label={{ value: 'Date of Creation', position: 'insideBottom', offset: 5, style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: '600' } }}
                    />
                    <YAxis 
                      label={{ value: 'No of Complaints', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px', fontWeight: '600' } }}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      domain={[0, maxTimelyYValue]}
                      ticks={timelyYAxisTicks}
                      stroke="#9ca3af"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRequests)" 
                      name="No of Complaints"
                      dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                    />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
            </div>
    </PageLayout>
  );
}
