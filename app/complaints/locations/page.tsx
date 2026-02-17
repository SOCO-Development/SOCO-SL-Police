'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MultiSelect from '@/components/forms/MultiSelect';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { PoliceLocation } from '@/types';
import {
  FaArrowLeft,
  FaCopy,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa';

type SortColumn = 'locationCategory' | 'locationName' | 'notificationContact' | null;
type SortDirection = 'asc' | 'desc' | null;

const LOCATION_TYPE_OPTIONS = [
  { value: 'apollo-center', label: 'Apollo Center' },
  { value: 'division', label: 'Division' },
  { value: 'police-station', label: 'Police Station' },
  { value: 'call-center', label: 'Call Center' },
  { value: 'tell-igp-unit', label: 'Tell IGP Unit' },
  { value: 'public', label: 'Public' },
  { value: 'ig-office', label: 'IG- Office' },
  { value: 's-dig-office', label: 'S DIG- Office' },
  { value: 'dig-office', label: 'DIG- Office' },
  { value: 'director-office', label: 'Director- Office' },
  { value: 'other-organizations', label: 'Other Organizations' },
  { value: 'ministry-public-security', label: 'Ministry of Public Security' },
  { value: 'narcotics-unit', label: 'Narcotics-Unit' },
];

// Sample data matching the design
const sampleLocations: PoliceLocation[] = [
  ...Array.from({ length: 840 }, (_, i) => ({
    id: `apollo-${i + 1}`,
    locationCategory: 'Apollo Center',
    locationName: `Appollo ${String(i + 1).padStart(2, '0')}`,
    notificationContact: '',
  })),
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `division-${i + 1}`,
    locationCategory: 'Division',
    locationName: `Division ${String(i + 1).padStart(2, '0')}`,
    notificationContact: '',
  })),
  ...Array.from({ length: 120 }, (_, i) => ({
    id: `station-${i + 1}`,
    locationCategory: 'Police Station',
    locationName: `Police Station ${String(i + 1).padStart(2, '0')}`,
    notificationContact: '',
  })),
];

export default function PoliceLocationsPage() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [hasViewed, setHasViewed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const entriesPerPage = 10;

  const filteredLocations = useMemo(() => {
    let result: PoliceLocation[] = [];
    if (hasViewed) {
      result = sampleLocations;
      if (selectedTypes.length > 0) {
        result = result.filter((loc) =>
          selectedTypes.some((t) => {
            const label = LOCATION_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? '';
            return loc.locationCategory.toLowerCase().includes(label.toLowerCase());
          })
        );
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (loc) =>
          loc.locationCategory.toLowerCase().includes(q) ||
          loc.locationName.toLowerCase().includes(q) ||
          (loc.notificationContact?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortColumn] ?? '';
        const bVal = b[sortColumn] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [hasViewed, selectedTypes, searchQuery, sortColumn, sortDirection]);

  const totalEntries = filteredLocations.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  const handleViewLocations = () => {
    setHasViewed(true);
    setCurrentPage(1);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === null) setSortDirection('asc');
      else if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortHeader = ({ column, label }: { column: SortColumn; label: string }) => (
    <th
      className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <div className="flex flex-row gap-0.5">
          <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === column && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
          <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === column && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
      </div>
    </th>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 w-full relative z-10 pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
            {/* Page Title and Back Button */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/complaints')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Police Locations</h1>
            </div>

            {/* Filters - 6 columns, 1 row */}
            <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="col-span-5">
                  <MultiSelect
                    value={selectedTypes}
                    onChange={setSelectedTypes}
                    options={LOCATION_TYPE_OPTIONS}
                    placeholder="Nothing selected"
                  />
                </div>
                <FilterPrimaryButton onClick={handleViewLocations}>
                  View Locations
                </FilterPrimaryButton>
              </div>
            </div>

            {/* Main Content Area - matches My Assignments / Lost Phone */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-6 relative z-0">
              {/* Export Buttons and Search */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700">
                    <FaCopy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700">
                    <FaFileCsv className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700">
                    <FaFileExcel className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700">
                    <FaFilePdf className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-gray-700">
                    <FaPrint className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Search:</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Search..."
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <SortHeader column="locationCategory" label="Location Category" />
                      <SortHeader column="locationName" label="Location Name" />
                      <SortHeader column="notificationContact" label="Notification Contact" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLocations.length > 0 ? (
                      paginatedLocations.map((loc, idx) => (
                        <tr
                          key={loc.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-xs text-gray-800">{loc.locationCategory}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {loc.locationName}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{loc.notificationContact || ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-gray-500">
                          {hasViewed
                            ? 'No locations found for selected types'
                            : 'Select location types and click View Locations'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    Previous
                  </button>
                  {totalPages > 0 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm border rounded font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2 py-1.5 text-sm text-gray-500">...</span>
                  )}
                  {totalPages > 5 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-1.5 text-sm border rounded font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
