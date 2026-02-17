'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequestDetailsModal from '@/components/modals/RequestDetailsModal';
import HistoryModal from '@/components/modals/HistoryModal';
import DatePicker from '@/components/forms/DatePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import { FaFileAlt, FaHistory, FaCopy, FaFileCsv, FaFileExcel, FaFilePdf, FaPrint, FaChevronUp, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { Complaint, HistoryEntry } from '@/types';

type SortColumn = 'reference' | 'created' | 'policeStation' | 'category' | 'forwardFrom' | 'status' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function MyComplaintsPage() {
  const router = useRouter();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const entriesPerPage = 10;

  // Sample data - replace with actual data from API
  const complaints: Complaint[] = [
    {
      id: '1',
      reference: '119/UTR/2024/15936',
      created: '2024/03/18',
      status: 'Complaint Resolved',
      complainantName: 'John Doe',
      complaintType: 'UTR',
      category: 'Vehicle accident',
      receivedVia: 'Call Center - 119',
      receivedDate: '2024/03/18 10:46:00 AM',
      incidentDate: '2024/03/18 10:46:00 AM',
      placeOfOffence: 'ගාලු මුවදොර ෂැංගිලා හෝටලය ඉදිරිපිට',
      policeStation: 'Fort',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '2',
      reference: '119/UTR/2024/15937',
      created: '2024/03/18',
      status: 'Complaint Rejected',
      complainantName: 'Jane Smith',
      complaintType: 'UTR',
      category: 'Persons suspected of involvement in crimes',
      receivedVia: 'Email',
      receivedDate: '2024/03/18 11:00:00 AM',
      incidentDate: '2024/03/18 11:00:00 AM',
      placeOfOffence: 'Colombo',
      policeStation: 'Mirihana',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '3',
      reference: '119/UTR/2024/15938',
      created: '2024/03/19',
      status: 'Complaint Resolved',
      complainantName: 'Robert Johnson',
      complaintType: 'UTR',
      category: 'Assault',
      receivedVia: 'Call Center - 119',
      receivedDate: '2024/03/19 09:30:00 AM',
      incidentDate: '2024/03/19 09:30:00 AM',
      placeOfOffence: 'Kandy',
      policeStation: 'Giranegama',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '4',
      reference: '119/UTR/2024/15939',
      created: '2024/03/19',
      status: 'Complaint Resolved',
      complainantName: 'Sarah Williams',
      complaintType: 'UTR',
      category: 'Land/Property disputes',
      receivedVia: 'Walk-in',
      receivedDate: '2024/03/19 02:15:00 PM',
      incidentDate: '2024/03/19 02:15:00 PM',
      placeOfOffence: 'Negombo',
      policeStation: 'Fort',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '5',
      reference: '119/UTR/2024/15940',
      created: '2024/03/20',
      status: 'Complaint Rejected',
      complainantName: 'Michael Brown',
      complaintType: 'UTR',
      category: 'Family disputes',
      receivedVia: 'Call Center - 119',
      receivedDate: '2024/03/20 10:00:00 AM',
      incidentDate: '2024/03/20 10:00:00 AM',
      placeOfOffence: 'Galle',
      policeStation: 'Mirihana',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '6',
      reference: '119/UTR/2024/15941',
      created: '2024/03/20',
      status: 'Complaint Resolved',
      complainantName: 'Emily Davis',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Email',
      receivedDate: '2024/03/20 11:30:00 AM',
      incidentDate: '2024/03/20 11:30:00 AM',
      placeOfOffence: 'Matara',
      policeStation: 'Giranegama',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '7',
      reference: '119/UTR/2024/15942',
      created: '2024/03/21',
      status: 'Complaint Resolved',
      complainantName: 'David Wilson',
      complaintType: 'UTR',
      category: 'Vehicle accident',
      receivedVia: 'Call Center - 119',
      receivedDate: '2024/03/21 08:45:00 AM',
      incidentDate: '2024/03/21 08:45:00 AM',
      placeOfOffence: 'Ratnapura',
      policeStation: 'Fort',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '8',
      reference: '119/UTR/2024/15943',
      created: '2024/03/21',
      status: 'Complaint Resolved',
      complainantName: 'Lisa Anderson',
      complaintType: 'UTR',
      category: 'Assault',
      receivedVia: 'Walk-in',
      receivedDate: '2024/03/21 01:20:00 PM',
      incidentDate: '2024/03/21 01:20:00 PM',
      placeOfOffence: 'Anuradhapura',
      policeStation: 'Mirihana',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '9',
      reference: '119/UTR/2024/15944',
      created: '2024/03/22',
      status: 'Complaint Rejected',
      complainantName: 'James Taylor',
      complaintType: 'UTR',
      category: 'Land/Property disputes',
      receivedVia: 'Email',
      receivedDate: '2024/03/22 09:15:00 AM',
      incidentDate: '2024/03/22 09:15:00 AM',
      placeOfOffence: 'Jaffna',
      policeStation: 'Giranegama',
      forwardFrom: '000000-Sandun',
    },
    {
      id: '10',
      reference: '119/UTR/2024/15945',
      created: '2024/03/22',
      status: 'Complaint Resolved',
      complainantName: 'Maria Garcia',
      complaintType: 'UTR',
      category: 'Family disputes',
      receivedVia: 'Call Center - 119',
      receivedDate: '2024/03/22 03:30:00 PM',
      incidentDate: '2024/03/22 03:30:00 PM',
      placeOfOffence: 'Batticaloa',
      policeStation: 'Fort',
      forwardFrom: '000000-Sandun',
    },
  ];

  const sampleHistory: HistoryEntry[] = [
    {
      location: 'Mirihana',
      assignedAt: '2024-03-18 10:51',
      workDays: 0,
      tasks: [
        {
          id: '1',
          assignee: 'Sandun',
          assigneeId: '000000',
          assigneeRole: 'Police Sergeant (PS)',
          assigneeStation: 'Mirihana',
          taskNumber: 'Task 01',
          date: '2024-03-18',
          taskDone: 'Complaint Entered',
          detail: '',
          timestamp: '3/18/2024 10:51:29 AM',
          assignedAt: '2024-03-18 10:51',
          workDays: 0,
        },
      ],
    },
  ];

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleViewHistory = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setIsHistoryModalOpen(true);
  };

  // Filter complaints based on search query
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((complaint) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        complaint.reference.toLowerCase().includes(searchLower) ||
        complaint.policeStation.toLowerCase().includes(searchLower) ||
        complaint.category.toLowerCase().includes(searchLower) ||
        complaint.status.toLowerCase().includes(searchLower) ||
        (complaint.forwardFrom && complaint.forwardFrom.toLowerCase().includes(searchLower))
      );
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortColumn) {
          case 'reference':
            aValue = a.reference;
            bValue = b.reference;
            break;
          case 'created':
            aValue = a.created;
            bValue = b.created;
            break;
          case 'policeStation':
            aValue = a.policeStation;
            bValue = b.policeStation;
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          case 'forwardFrom':
            aValue = a.forwardFrom || '';
            bValue = b.forwardFrom || '';
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return result;
  }, [complaints, searchQuery, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Pagination
  const totalEntries = filteredComplaints.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('resolved')) {
      return 'bg-green-100 text-green-700';
    } else if (statusLower.includes('rejected')) {
      return 'bg-red-100 text-red-700';
    } else if (statusLower.includes('pending') || statusLower.includes('open')) {
      return 'bg-yellow-100 text-yellow-700';
    } else if (statusLower.includes('in progress') || statusLower.includes('assigned')) {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

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
              <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
            </div>

            {/* Filters - 4 columns (same layout as View Complaints) */}
            <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
              <div className="grid grid-cols-4 gap-4">
                <DatePicker defaultValue="01-01-2021" className="w-full" />
                <DatePicker defaultValue="08-01-2026" className="w-full" />
                <CustomSelect options={[{ value: '3', label: '3 items selected' }]} className="w-full" />
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
                      setCurrentPage(1); // Reset to first page on search
                    }}
                    className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Search..."
                  />
                </div>
              </div>

              {/* Complaints Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('reference')}
                      >
                        <div className="flex items-center gap-1.5">
                          Reference
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'reference' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'reference' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('created')}
                      >
                        <div className="flex items-center gap-1.5">
                          Created
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'created' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'created' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('policeStation')}
                      >
                        <div className="flex items-center gap-1.5">
                          Police Station
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'policeStation' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'policeStation' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('category')}
                      >
                        <div className="flex items-center gap-1.5">
                          Complaint Category
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'category' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'category' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('forwardFrom')}
                      >
                        <div className="flex items-center gap-1.5">
                          Forward from
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'forwardFrom' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'forwardFrom' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1.5">
                          Current status
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'status' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'status' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th className="text-center py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComplaints.length > 0 ? (
                      paginatedComplaints.map((complaint, index) => (
                        <tr 
                          key={complaint.id} 
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {complaint.reference}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.created}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.policeStation}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.category}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.forwardFrom || '-'}</td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(complaint)}
                                className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Details"
                              >
                                <FaFileAlt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleViewHistory(complaint.id)}
                                className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                title="View History"
                              >
                                <FaHistory className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-gray-500">
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
                  Showing {startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
    </div>
  );
}
