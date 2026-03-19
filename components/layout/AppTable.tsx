'use client';

import { type ReactNode } from 'react';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { FileText } from 'lucide-react';

export interface AppTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'right';
  render?: (value: unknown, row: T) => ReactNode;
}

export interface AppTableProps<T> {
  columns: AppTableColumn<T>[];
  data: T[];
  keyField: keyof T | string;
  sortKey?: keyof T | string | null;
  sortAsc?: boolean;
  onSort?: (key: keyof T | string) => void;
  emptyMessage?: string;
  /** When true, wraps table in rounded card (CrimeVisitList/VehicleList style). When false, table only (for ContentCard) */
  variant?: 'card' | 'plain';
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalEntries: number;
    entriesPerPage: number;
    onPageChange: (page: number) => void;
  };
}

const tableClasses = {
  wrapper: 'overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white',
  wrapperPlain: 'overflow-x-auto',
  thead: 'bg-gray-50 border-b border-gray-200',
  th: 'text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide',
  thRight: 'text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide',
  tr: 'border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors',
  td: 'px-4 py-3 text-sm',
  empty: 'text-center py-20 text-gray-500',
};

export default function AppTable<T extends object>({
  columns,
  data,
  keyField,
  sortKey = null,
  sortAsc = true,
  onSort,
  emptyMessage = 'No data found.',
  variant = 'card',
  pagination,
}: AppTableProps<T>) {
  const startIndex = pagination
    ? (pagination.currentPage - 1) * pagination.entriesPerPage
    : 0;
  const endIndex = pagination
    ? Math.min(startIndex + pagination.entriesPerPage, pagination.totalEntries)
    : data.length;
  const totalEntries = pagination ? pagination.totalEntries : data.length;
  const totalPages = pagination ? pagination.totalPages : 1;
  const displayData = data;

  const getCellValue = (row: T, key: string): unknown => {
    const v = (row as Record<string, unknown>)[key];
    return v !== undefined && v !== null ? v : '';
  };

  if (data.length === 0) {
    return (
      <div className={variant === 'card' ? tableClasses.wrapper : tableClasses.wrapperPlain}>
        <div className={tableClasses.empty}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const tableContent = (
    <table className="w-full text-sm text-gray-900">
      <thead>
        <tr className={tableClasses.thead}>
          {columns.map((col) => {
            const key = String(col.key);
            const isSortable = col.sortable && onSort;
            const isActive = sortKey === key;
            const alignRight = col.align === 'right';
            return (
              <th
                key={key}
                scope="col"
                className={alignRight ? tableClasses.thRight : tableClasses.th}
                aria-sort={
                  isSortable
                    ? isActive
                      ? sortAsc
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    : undefined
                }
              >
                {isSortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(key)}
                    className={`flex items-center gap-1.5 cursor-pointer hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded ${alignRight ? 'justify-end w-full' : ''}`}
                  >
                    {col.label}
                    <span className="flex flex-row gap-0.5" aria-hidden>
                      <FaChevronUp
                        className={`w-2.5 h-2.5 ${
                          isActive && sortAsc ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                      <FaChevronDown
                        className={`w-2.5 h-2.5 ${
                          isActive && !sortAsc ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {displayData.map((row, index) => {
          const rowKey = String((row as Record<string, unknown>)[String(keyField)] ?? index);
          return (
            <tr key={rowKey} className={tableClasses.tr}>
              {columns.map((col) => {
                const key = String(col.key);
                const value = getCellValue(row, key);
                const content = col.render
                  ? col.render(value, row)
                  : String(value);
                const alignRight = col.align === 'right';
                return (
                  <td
                    key={key}
                    className={`${tableClasses.td} ${alignRight ? 'text-right' : ''} ${col.className ?? ''}`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <>
      <div className={variant === 'card' ? tableClasses.wrapper : tableClasses.wrapperPlain}>
        {tableContent}
      </div>

      {pagination && totalPages > 0 && (
        <div
          className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200"
          role="navigation"
          aria-label="Pagination"
        >
          <div className="text-sm text-gray-600">
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of{' '}
            {totalEntries} entries
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              aria-label="Previous page"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 4) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = pagination.currentPage - 3 + i;
              }
              if (pageNum < 1 || pageNum > totalPages) return null;
              const isCurrent = pagination.currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`px-3 py-1.5 text-sm border rounded font-medium transition-colors ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label={isCurrent ? `Page ${pageNum}, current` : `Page ${pageNum}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
