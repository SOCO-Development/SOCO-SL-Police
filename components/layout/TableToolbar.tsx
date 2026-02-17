'use client';

import { type ReactNode } from 'react';
import { FaCopy, FaFileCsv, FaFileExcel, FaFilePdf, FaPrint } from 'react-icons/fa';

export const exportButtonClass =
  'flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700';

interface TableToolbarProps {
  /** Custom left content (export buttons). If not set, renders default Copy/Excel/CSV/PDF/Print with optional handlers. */
  left?: ReactNode;
  /** Optional handlers for default buttons (no-op if not provided) */
  onCopy?: () => void;
  onCsv?: () => void;
  onPrint?: () => void;
  /** Search value (controlled). If not provided, search is not shown. */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Wrapper class (e.g. "print:hidden") */
  className?: string;
}

/**
 * Standard toolbar above data tables: Copy, Excel, CSV, PDF, Print + Search.
 * Same UI on View Complaints, Complaint Report, My Complaints, Assignments, etc.
 */
export default function TableToolbar({
  left,
  onCopy,
  onCsv,
  onPrint,
  searchValue = '',
  onSearchChange,
  className = '',
}: TableToolbarProps) {
  const defaultLeft = (
    <>
      <button type="button" onClick={onCopy} className={exportButtonClass}>
        <FaCopy className="w-4 h-4" />
        <span>Copy</span>
      </button>
      <button type="button" className={exportButtonClass}>
        <FaFileExcel className="w-4 h-4" />
        <span>Excel</span>
      </button>
      <button type="button" onClick={onCsv} className={exportButtonClass}>
        <FaFileCsv className="w-4 h-4" />
        <span>CSV</span>
      </button>
      <button type="button" className={exportButtonClass}>
        <FaFilePdf className="w-4 h-4" />
        <span>PDF</span>
      </button>
      <button type="button" onClick={onPrint} className={exportButtonClass}>
        <FaPrint className="w-4 h-4" />
        <span>Print</span>
      </button>
    </>
  );

  return (
    <div className={`flex flex-wrap justify-between items-center mb-6 gap-4 ${className}`}>
      <div className="flex flex-wrap gap-2">{left ?? defaultLeft}</div>
      {onSearchChange != null && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Search:</label>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            placeholder="Search..."
          />
        </div>
      )}
    </div>
  );
}
