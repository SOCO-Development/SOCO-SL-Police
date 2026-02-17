'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequestDetailsModal from '@/components/modals/RequestDetailsModal';
import HistoryModal from '@/components/modals/HistoryModal';
import ReActivateModal from '@/components/modals/ReActivateModal';
import DatePicker from '@/components/forms/DatePicker';
import MultiSelect from '@/components/forms/MultiSelect';
import {
  FaArrowLeft,
  FaFileAlt,
  FaHistory,
  FaUndo,
  FaCopy,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaChevronUp,
  FaChevronDown,
} from 'react-icons/fa';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { Complaint, HistoryEntry } from '@/types';

type SortColumn = 'reference' | 'created' | 'policeStation' | 'category' | 'forwardFrom' | 'status' | null;
type SortDirection = 'asc' | 'desc' | null;

interface ReactivateComplaint extends Complaint {
  createdTime?: string;
  complainantInfo?: string;
  daysCompleted?: number;
  statusText?: string;
}

const COMPLAINT_TYPE_OPTIONS = [
  { value: 'utr', label: 'UTR' },
  { value: 'citr', label: 'CITR' },
  { value: 'lost-phone', label: 'Lost Phone' },
  { value: 'tell-igp', label: 'Tell IGP' },
  { value: 'nhd-118', label: 'NHD 118' },
  { value: 'narcotics', label: 'Narcotics' },
  { value: 'nhd-public', label: 'NHD - Public' },
];

const POLICE_STATION_OPTIONS = [
  ...Array.from({ length: 15 }, (_, i) => ({
    value: `appollo-${i + 1}`,
    label: `Appollo ${String(i + 1).padStart(2, '0')} Apollo Center`,
  })),
  { value: 'colombo-emergency', label: 'Colombo Emergency Apollo Center' },
  { value: 'nuwaraeliya-division', label: 'Nuwaraeliya Division Division' },
  { value: 'kegalle', label: 'Kegalle' },
  { value: 'hatton-division', label: 'Hatton Division' },
];

const STATUS_OPTIONS = [
  { value: 'resolved', label: 'Complaint Resolved' },
  { value: 'rejected', label: 'Complaint Rejected' },
];

// Sample data for re-activated/resolved complaints
const sampleComplaints: ReactivateComplaint[] = [
  {
    id: '1',
    reference: 'TEL-IGP/2026/0761',
    created: '2026-02-02',
    createdTime: '09:54:07',
    status: 'Complaint Resolved',
    statusText: 'completed in 0',
    complainantName: 'Dilshani Rashmika',
    complainantInfo: 'Dilshani Rashmika N9375835-0718073882',
    complaintType: 'Tell IGP',
    category: 'Land/Property disputes',
    receivedVia: 'Tell IGP Online',
    receivedDate: '2026-02-02 09:54:07',
    incidentDate: '2026-02-02 15:00:00',
    placeOfOffence: 'Godapola',
    policeStation: 'Kegalle',
    forwardFrom: '666666-citizen',
    daysCompleted: 0,
  },
  {
    id: '2',
    reference: 'TEL-IGP/2026/0760',
    created: '2026-02-02',
    createdTime: '09:30:15',
    status: 'Complaint Resolved',
    statusText: 'completed in 0',
    complainantName: 'Kamal Perera',
    complainantInfo: 'Kamal Perera N9123456-0771234567',
    complaintType: 'Tell IGP',
    category: 'Vehicle accident',
    receivedVia: 'Tell IGP Online',
    receivedDate: '2026-02-02 09:30:15',
    incidentDate: '2026-02-01 14:20:00',
    placeOfOffence: 'Colombo',
    policeStation: 'Kegalle',
    forwardFrom: '100187-officer',
    daysCompleted: 0,
  },
  {
    id: '3',
    reference: 'TEL-IGP/2026/0759',
    created: '2026-02-02',
    createdTime: '08:45:22',
    status: 'Complaint Resolved',
    statusText: 'completed in 0',
    complainantName: 'Samantha Silva',
    complainantInfo: 'Samantha Silva N8987654-0719876543',
    complaintType: 'Tell IGP',
    category: 'Property damage',
    receivedVia: 'Tell IGP Online',
    receivedDate: '2026-02-02 08:45:22',
    incidentDate: '2026-02-01 10:00:00',
    placeOfOffence: 'Kandy',
    policeStation: 'Kegalle',
    forwardFrom: '666666-citizen',
    daysCompleted: 0,
  },
];

const sampleHistory: HistoryEntry[] = [
  {
    location: 'Genral Citizen',
    assignedAt: '2026-02-02 09:54',
    workDays: 0,
    tasks: [
      {
        id: '1',
        assignee: 'citizen',
        assigneeId: '666666-citizen',
        assigneeRole: 'Public user - Genral Citizen',
        assigneeStation: 'Genral Citizen',
        taskNumber: 'Task 01',
        date: '2026-02-02',
        taskDone: 'Complaint Entered',
        detail: '',
        timestamp: '2/2/2026 9:54:07 AM',
        assignedAt: '2026-02-02 09:54',
        workDays: 0,
      },
      {
        id: '2',
        assignee: 'citizen',
        assigneeId: '666666-citizen',
        assigneeRole: 'Public user - Genral Citizen',
        assigneeStation: 'Genral Citizen',
        taskNumber: 'Task 02',
        date: '2026-02-02',
        taskDone: 'Complaint Forwarded',
        detail: 'Initial Complaint',
        timestamp: '2/2/2026 9:54:07 AM',
        assignedAt: '2026-02-02 09:54',
        workDays: 0,
      },
    ],
  },
  {
    location: 'Kegalle',
    assignedAt: '2026-02-02 09:54',
    workDays: 0,
    tasks: [],
  },
];

export default function ReactivateComplaintsPage() {
  const router = useRouter();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReActivateModalOpen, setIsReActivateModalOpen] = useState(false);
  const [selectedComplaintForReactivate, setSelectedComplaintForReactivate] = useState<ReactivateComplaint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [fromDate, setFromDate] = useState('02-02-2026');
  const [toDate, setToDate] = useState('02-02-2026');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const entriesPerPage = 10;

  const filteredComplaints = useMemo(() => {
    let result = sampleComplaints.filter((c) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        c.reference.toLowerCase().includes(searchLower) ||
        c.policeStation.toLowerCase().includes(searchLower) ||
        c.category.toLowerCase().includes(searchLower) ||
        (c.complainantInfo?.toLowerCase().includes(searchLower)) ||
        (c.forwardFrom?.toLowerCase().includes(searchLower)) ||
        c.status.toLowerCase().includes(searchLower)
      );
    });

    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        switch (sortColumn) {
          case 'reference':
            aVal = a.reference;
            bVal = b.reference;
            break;
          case 'created':
            aVal = a.created;
            bVal = b.created;
            break;
          case 'policeStation':
            aVal = a.policeStation;
            bVal = b.policeStation;
            break;
          case 'category':
            aVal = a.category;
            bVal = b.category;
            break;
          case 'forwardFrom':
            aVal = a.forwardFrom || '';
            bVal = b.forwardFrom || '';
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [searchQuery, sortColumn, sortDirection]);

  const totalEntries = filteredComplaints.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

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

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleViewHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleReActivate = (complaint: ReactivateComplaint) => {
    setSelectedComplaintForReactivate(complaint);
    setIsReActivateModalOpen(true);
  };

  const handleSubmitReActivate = (reason: string) => {
    console.log('Re-activate complaint:', selectedComplaintForReactivate?.reference, reason);
    setSelectedComplaintForReactivate(null);
  };

  const getProgressBarWidth = (daysCompleted: number = 0) => {
    const maxDays = 10;
    return Math.min((daysCompleted / maxDays) * 100, 100);
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
              <h1 className="text-3xl font-bold text-gray-900">Re-Activate Complaints</h1>
            </div>

            {/* Filters - 6 columns, 1 row */}
            <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
              <div className="grid grid-cols-6 gap-4 items-center">
                <DatePicker value={fromDate} onChange={setFromDate} className="w-full" />
                <DatePicker value={toDate} onChange={setToDate} className="w-full" />
                <MultiSelect
                  value={selectedTypes}
                  onChange={setSelectedTypes}
                  options={COMPLAINT_TYPE_OPTIONS}
                  placeholder="Nothing selected"
                />
                <MultiSelect
                  value={selectedStations}
                  onChange={setSelectedStations}
                  options={POLICE_STATION_OPTIONS}
                  placeholder="Nothing selected"
                />
                <MultiSelect
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                  options={STATUS_OPTIONS}
                  placeholder="Nothing selected"
                />
                <FilterPrimaryButton>View Tasks</FilterPrimaryButton>
              </div>
            </div>

            {/* Main Content Area */}
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
                      <SortHeader column="reference" label="Reference" />
                      <SortHeader column="created" label="Created" />
                      <SortHeader column="policeStation" label="Police Station" />
                      <SortHeader column="category" label="Complaint Category" />
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Complainant Info</th>
                      <SortHeader column="forwardFrom" label="Forward from" />
                      <SortHeader column="status" label="Current status" />
                      <th className="text-center py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComplaints.length > 0 ? (
                      paginatedComplaints.map((complaint, index) => (
                        <tr
                          key={complaint.id}
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-xs">
                            <a href="#" className="text-blue-600 hover:underline font-medium">
                              {complaint.reference}
                            </a>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            {complaint.created} {complaint.createdTime}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.policeStation}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.category}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.complainantInfo || complaint.complainantName}</td>
                          <td className="py-2.5 px-4 text-xs">
                            {complaint.forwardFrom ? (
                              <a href="#" className="text-blue-600 hover:underline">
                                {complaint.forwardFrom}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              <div className="h-1 bg-gray-200 rounded-full w-full">
                                <div
                                  className="h-1 bg-green-500 rounded-full"
                                  style={{ width: `${getProgressBarWidth(complaint.daysCompleted)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-700 font-medium">
                                {complaint.status} {complaint.statusText && complaint.statusText}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleViewDetails(complaint)}
                                className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Details"
                              >
                                <FaFileAlt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleViewHistory}
                                className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                title="View History"
                              >
                                <FaHistory className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReActivate(complaint)}
                                className="p-1.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-colors"
                                title="Re-Activate"
                              >
                                <FaUndo className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-xs text-gray-500">
                          No complaints found
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
                  {totalPages > 0 &&
                    Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
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

      {/* Modals */}
      <RequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        complaint={selectedComplaint}
      />
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={sampleHistory}
      />
      <ReActivateModal
        isOpen={isReActivateModalOpen}
        onClose={() => {
          setIsReActivateModalOpen(false);
          setSelectedComplaintForReactivate(null);
        }}
        onSubmit={handleSubmitReActivate}
        reference={selectedComplaintForReactivate?.reference}
      />
    </div>
  );
}
