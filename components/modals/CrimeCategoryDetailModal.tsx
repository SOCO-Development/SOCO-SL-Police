'use client';

import { X } from 'lucide-react';
import type { CrimeCategoryDatum } from '@/lib/crimeCategories';

interface CrimeCategoryDetailModalProps {
  category: CrimeCategoryDatum | null;
  totalCount: number;
  onClose: () => void;
}

export default function CrimeCategoryDetailModal({ category, totalCount, onClose }: CrimeCategoryDetailModalProps) {
  if (!category) return null;

  const percentage = totalCount > 0 ? ((category.value / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: category.fill }} />
            <h2 className="text-lg font-semibold">{category.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Crimes</p>
              <p className="text-2xl font-bold text-gray-900">{category.value.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Share of Total</p>
              <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Reported Cases</span>
              <span className="font-semibold text-gray-900">{category.value.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Solved Cases</span>
              <span className="font-semibold text-gray-900">{Math.round(category.value * 0.62).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Under Investigation</span>
              <span className="font-semibold text-gray-900">{Math.round(category.value * 0.28).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-gray-500">Closed - Unresolved</span>
              <span className="font-semibold text-gray-900">{Math.round(category.value * 0.1).toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">Data shown is sample/mock data pending backend integration.</p>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
