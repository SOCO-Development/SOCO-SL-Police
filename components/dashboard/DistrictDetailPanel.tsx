'use client';

import { Shield, X, CheckCircle2, Clock, XCircle, MapPin, Clock3, FileText, Eye, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { DistrictCvrDatum } from '@/lib/districtCvrData';
import type { DistrictColor } from '@/lib/districtColors';
import CountUpNumber from '@/components/dashboard/CountUpNumber';

interface DistrictDetailPanelProps {
  districtName: string | null;
  data: DistrictCvrDatum | null;
  color: DistrictColor;
  onClose: () => void;
  onViewFullReport?: (districtName: string) => void;
}

export default function DistrictDetailPanel({ districtName, data, color, onClose, onViewFullReport }: DistrictDetailPanelProps) {
  const isOpen = districtName !== null && data !== null;
  const approvalRate = data && data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0;
  const trendData = data ? data.weeklyTrend.map((value, index) => ({ index, value })) : [];

  return (
    <>
      <div
        className={`fixed top-14 inset-x-0 bottom-0 bg-black/30 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-14 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {districtName && data && (
          <>
            <div
              className="px-6 pt-6 pb-5 text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color.dark}, ${color.dark}dd)` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">{data.province}</p>
                    <h2 className="text-xl font-bold">{districtName}</h2>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close panel">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/15 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-2xl font-extrabold leading-none"><CountUpNumber value={data.total} /></p>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide mt-1">CVRs</p>
                </div>
                <div className="bg-white/15 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-2xl font-extrabold leading-none"><CountUpNumber value={data.officers} /></p>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide mt-1">Officers</p>
                </div>
                <div className="bg-white/15 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-2xl font-extrabold leading-none"><CountUpNumber value={data.casesPerMonth} /></p>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide mt-1">Cases/Mo</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">CVR Breakdown</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-green-50 border border-green-200/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Approved</span>
                    </div>
                    <p className="text-lg font-extrabold text-green-700"><CountUpNumber value={data.approved} /></p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Pending</span>
                    </div>
                    <p className="text-lg font-extrabold text-yellow-700"><CountUpNumber value={data.pending} /></p>
                  </div>
                  <div className="bg-red-50 border border-red-200/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Rejected</span>
                    </div>
                    <p className="text-lg font-extrabold text-red-700"><CountUpNumber value={data.rejected} /></p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${(data.approved / data.total) * 100}%` }} />
                  <div className="h-full bg-yellow-500" style={{ width: `${(data.pending / data.total) * 100}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${(data.rejected / data.total) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-500"><CountUpNumber value={approvalRate} />% approval rate</p>
                  <p className="text-xs font-semibold text-green-600">+3% this month</p>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Operational Data</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">Crime Scene Visits</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900"><CountUpNumber value={data.crimeSceneVisits} /> <span className="text-xs font-normal text-gray-400">visits</span></span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <Clock3 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">Avg. Response Time</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900"><CountUpNumber value={data.avgResponseTimeMin} /> <span className="text-xs font-normal text-gray-400">min</span></span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-600">Evidence Collected</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900"><CountUpNumber value={data.evidenceCollected} /> <span className="text-xs font-normal text-gray-400">items</span></span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">7-Day Trend</h3>
                <div className="bg-gray-50 rounded-lg p-3" style={{ height: 90 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                      <defs>
                        <linearGradient id="districtTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color.dark} stopOpacity={0.12} />
                          <stop offset="100%" stopColor={color.dark} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color.dark}
                        strokeWidth={2}
                        fill="url(#districtTrendFill)"
                        dot={false}
                        activeDot={{ r: 4, fill: color.dark, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                  {data.recentActivity.map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-3.5 py-2.5 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.dark }} />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{item.timeAgo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => onViewFullReport?.(districtName)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: color.dark }}
              >
                <Eye className="w-4 h-4" />
                View Full Report
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
