'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Handshake, Users, Trash2 } from 'lucide-react';
import { FaArrowLeft } from 'react-icons/fa';
import Button from '@/components/buttons/Button';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedItems1, setSelectedItems1] = useState('11');
  const [selectedItems2, setSelectedItems2] = useState('7');
  const [selectedItems3, setSelectedItems3] = useState('835');

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

  // Sample data for Medium Categorization
  const categoryData = [
    { name: 'Anti-corruption information', value: 20574, fill: '#9b5b8f' },
    { name: 'Incidents', value: 38493, fill: '#c41e3a' },
    { name: 'Miscellaneous Complaints', value: 29700, fill: '#28a745' },
    { name: 'Traffic offences', value: 9539, fill: '#f0ad4e' },
    { name: 'Crimes', value: 23600, fill: '#000000' },
    { name: 'Information', value: 4641, fill: '#004085' },
    { name: 'Violence and abuse against children and women', value: 2069, fill: '#e83e8c' },
    { name: 'Bribery and corruption scams', value: 495, fill: '#6f42c1' },
    { name: 'Complaints against the police', value: 741, fill: '#fd7e14' },
    { name: 'Other institutions under the Ministry', value: 2, fill: '#17a2b8' },
    { name: 'Electoral and Political', value: 1, fill: '#6c757d' },
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

  const itemsSelectedOptions1 = [
    { value: 'UTR', label: 'UTR' },
    { value: 'CITR', label: 'CITR' },
    { value: 'Lost Phone', label: 'Lost Phone' },
    { value: 'Tell IGP', label: 'Tell IGP' },
    { value: 'NHD 118', label: 'NHD 118' },
    { value: 'Narcotics', label: 'Narcotics' },
    { value: 'NHD - Public', label: 'NHD - Public' },
  ];

  const itemsSelectedOptions2 = [
    { value: 'Appollo 01', label: 'Appollo 01' },
    { value: 'Appollo 02', label: 'Appollo 02' },
    { value: 'Appollo 03', label: 'Appollo 03' },
    { value: 'Appollo 04', label: 'Appollo 04' },
    { value: 'Appollo 05', label: 'Appollo 05' },
    { value: 'Appollo 06', label: 'Appollo 06' },
    { value: 'Appollo 07', label: 'Appollo 07' },
    { value: 'Appollo 08', label: 'Appollo 08' },
    { value: 'Appollo 09', label: 'Appollo 09' },
    { value: 'Appollo 10', label: 'Appollo 10' },
    { value: 'Appollo 11', label: 'Appollo 11' },
    { value: 'Appollo 12', label: 'Appollo 12' },
    { value: 'Appollo 13', label: 'Appollo 13' },
    { value: 'Appollo 14', label: 'Appollo 14' },
    { value: 'Appollo 15', label: 'Appollo 15' },
    { value: 'Colombo Emergency', label: 'Colombo Emergency' },
    { value: 'Nuwaraeliya Division', label: 'Nuwaraeliya Division' },
    { value: 'Kandy Division', label: 'Kandy Division' },
    { value: 'Gampaha Division', label: 'Gampaha Division' },
    { value: 'Kalutara Division', label: 'Kalutara Division' },
    { value: 'Matara Division', label: 'Matara Division' },
    { value: 'Galle Division', label: 'Galle Division' },
  ];

  const itemsSelectedOptions3 = [
    { value: 'Crimes', label: 'Crimes' },
    { value: 'Information', label: 'Information' },
    { value: 'Incidents', label: 'Incidents' },
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 w-full relative z-10 pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
            {/* Page Title and Back Button */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="secondary" onClick={() => router.push('/reports')}>
                <FaArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">360 Dashboard</h1>
            </div>

            {/* Filter Section - 2 Rows, 4 Columns */}
            <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
              <div className="grid grid-cols-4 gap-4">
                {/* First Row - 4 Columns */}
                <DatePicker
                  defaultValue="01-12-2025"
                  className="w-full"
                />
                <TimePicker
                  defaultValue="10:44"
                  className="w-full"
                />
                <DatePicker
                  defaultValue="08-01-2026"
                  className="w-full"
                />
                <TimePicker
                  defaultValue="11:44"
                  className="w-full"
                />
                {/* Second Row - 4 Columns */}
                <CustomSelect
                  value={selectedItems1}
                  onChange={(value) => setSelectedItems1(value)}
                  options={itemsSelectedOptions1}
                  className="w-full"
                />
                <CustomSelect
                  value={selectedItems2}
                  onChange={(value) => setSelectedItems2(value)}
                  options={itemsSelectedOptions2}
                  className="w-full"
                />
                <CustomSelect
                  value={selectedItems3}
                  onChange={(value) => setSelectedItems3(value)}
                  options={itemsSelectedOptions3}
                  className="w-full"
                />
                <FilterPrimaryButton>View Dashboard</FilterPrimaryButton>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-8 relative z-0">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* TOTAL REQUESTS */}
                <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl p-6 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md flex-shrink-0">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">TOTAL REQUESTS</p>
                      <p className="text-5xl font-extrabold text-blue-700 leading-none mb-1">129,845</p>
                      <p className="text-sm font-semibold text-blue-600">Live</p>
                    </div>
                  </div>
                  <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  </div>

                {/* COMPLETED REQUESTS */}
                <div className="bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-xl p-6 shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md flex-shrink-0">
                      <Handshake className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">COMPLETED REQUESTS</p>
                      <p className="text-5xl font-extrabold text-green-700 leading-none mb-1">37,369</p>
                      <p className="text-sm font-semibold text-green-600">(28.8%)</p>
                    </div>
                  </div>
                  <div className="h-1 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '28.8%' }}></div>
                  </div>
                </div>

                {/* ON-DESK REQUESTS */}
                <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-50 rounded-xl p-6 shadow-lg border border-red-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md flex-shrink-0">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">ON-DESK REQUESTS</p>
                      <p className="text-5xl font-extrabold text-red-700 leading-none mb-1">92,475</p>
                      <p className="text-sm font-semibold text-red-600">(71.2%)</p>
                  </div>
                  </div>
                  <div className="h-1 bg-red-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: '71.2%' }}></div>
                  </div>
                </div>

                {/* REJECTED REQUESTS */}
                <div className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 rounded-xl p-6 shadow-lg border border-yellow-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md flex-shrink-0">
                      <Trash2 className="w-7 h-7 text-white" />
              </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">REJECTED REQUESTS</p>
                      <p className="text-5xl font-extrabold text-red-700 leading-none mb-1">1</p>
                      <p className="text-sm font-semibold text-yellow-600">(0%)</p>
                    </div>
                  </div>
                  <div className="h-1 bg-yellow-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" style={{ width: '0%' }}></div>
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
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f0ad4e' }}></div>
                        <span className="text-gray-600">Rejected</span>
                        </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#28a745' }}></div>
                        <span className="text-gray-600">Completed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c41e3a' }}></div>
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
                      <Bar dataKey="rejected" fill="#f0ad4e" name="Rejected" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" fill="#28a745" name="Completed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" fill="#c41e3a" name="Pending" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Medium Categorization Chart */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 outline-none focus:outline-none" tabIndex={-1}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Medium Categorization</h2>
                  <div className="flex items-start gap-6">
                    {/* Pie Chart on Left */}
                    <div className="flex-shrink-0 flex flex-col">
                      {/* Total Complaints Card at Top */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Complaints</p>
                        <p className="text-2xl font-bold text-gray-900">{categoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</p>
                      </div>
                      {/* Pie Chart */}
                      <ResponsiveContainer width={280} height={280}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2.5} />
                            ))}
                          </Pie>
                          <Tooltip 
                            wrapperStyle={{ zIndex: 9999 }}
                            contentStyle={{ zIndex: 9999 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0];
                                const total = categoryData.reduce((sum, i) => sum + i.value, 0);
                                const percentage = ((data.value as number / total) * 100).toFixed(1);
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
                    {/* Legend on Right */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                        {categoryData.map((item, index) => {
                          const total = categoryData.reduce((sum, i) => sum + i.value, 0);
                          const percentage = ((item.value / total) * 100).toFixed(1);
                          return (
                            <div 
                              key={index} 
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
                    </div>
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
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
