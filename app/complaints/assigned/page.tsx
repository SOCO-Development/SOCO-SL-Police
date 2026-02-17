'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequestDetailsModal from '@/components/modals/RequestDetailsModal';
import HistoryModal from '@/components/modals/HistoryModal';
import DatePicker from '@/components/forms/DatePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import { FaFileAlt, FaHistory, FaCopy, FaFileCsv, FaFileExcel, FaFilePdf, FaPrint, FaChevronUp, FaChevronDown, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { Complaint, HistoryEntry } from '@/types';

type SortColumn = 'reference' | 'created' | 'policeStation' | 'category' | 'complainantInfo' | 'forwardFrom' | 'currentStatus' | null;
type SortDirection = 'asc' | 'desc' | null;

interface AssignedComplaint extends Complaint {
  daysPending?: number;
  forwardFrom?: string;
  complainantInfo?: string;
}

export default function AssignedComplaintsPage() {
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
  const complaints: AssignedComplaint[] = [
    {
      id: '1',
      reference: '119/UTR/2026/01/33953',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'John Doe',
      complaintType: 'UTR',
      category: 'Scolded and threatened',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/11 10:46:00 AM',
      incidentDate: '2026/01/11 10:46:00 AM',
      placeOfOffence: 'Mawathagama',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'සිංහල',
    },
    {
      id: '2',
      reference: '119/UTR/2026/01/33952',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Jane Smith',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Email',
      receivedDate: '2026/01/11 11:00:00 AM',
      incidentDate: '2026/01/11 11:00:00 AM',
      placeOfOffence: 'Colombo',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'English',
    },
    {
      id: '3',
      reference: '119/UTR/2026/01/33951',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Robert Johnson',
      complaintType: 'UTR',
      category: 'Scolded and threatened',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/11 09:30:00 AM',
      incidentDate: '2026/01/11 09:30:00 AM',
      placeOfOffence: 'Kandy',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'සිංහල',
    },
    {
      id: '4',
      reference: '119/UTR/2026/01/33950',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Sarah Williams',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Walk-in',
      receivedDate: '2026/01/11 02:15:00 PM',
      incidentDate: '2026/01/11 02:15:00 PM',
      placeOfOffence: 'Negombo',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'English',
    },
    {
      id: '5',
      reference: '119/UTR/2026/01/33949',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Michael Brown',
      complaintType: 'UTR',
      category: 'Scolded and threatened',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/11 10:00:00 AM',
      incidentDate: '2026/01/11 10:00:00 AM',
      placeOfOffence: 'Galle',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: '',
    },
    {
      id: '6',
      reference: '119/UTR/2026/01/33948',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Emily Davis',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Email',
      receivedDate: '2026/01/11 11:30:00 AM',
      incidentDate: '2026/01/11 11:30:00 AM',
      placeOfOffence: 'Matara',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'සිංහල',
    },
    {
      id: '7',
      reference: '119/UTR/2026/01/33947',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'David Wilson',
      complaintType: 'UTR',
      category: 'Scolded and threatened',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/11 08:45:00 AM',
      incidentDate: '2026/01/11 08:45:00 AM',
      placeOfOffence: 'Ratnapura',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'English',
    },
    {
      id: '8',
      reference: '119/UTR/2026/01/33946',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Lisa Anderson',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Walk-in',
      receivedDate: '2026/01/11 01:20:00 PM',
      incidentDate: '2026/01/11 01:20:00 PM',
      placeOfOffence: 'Anuradhapura',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: '',
    },
    {
      id: '9',
      reference: '119/UTR/2026/01/33945',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'James Taylor',
      complaintType: 'UTR',
      category: 'Scolded and threatened',
      receivedVia: 'Email',
      receivedDate: '2026/01/11 09:15:00 AM',
      incidentDate: '2026/01/11 09:15:00 AM',
      placeOfOffence: 'Jaffna',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'English',
    },
    {
      id: '10',
      reference: '119/UTR/2026/01/33944',
      created: '2026/01/11',
      status: 'Assigned',
      complainantName: 'Maria Garcia',
      complaintType: 'UTR',
      category: 'Heroin - diacetyl morphine',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/11 03:30:00 PM',
      incidentDate: '2026/01/11 03:30:00 PM',
      placeOfOffence: 'Batticaloa',
      policeStation: 'Mawathagama',
      forwardFrom: 'mawathagama-Mawathagama',
      daysPending: 1,
      complainantInfo: 'සිංහල',
    },
  ];

  const sampleHistory: HistoryEntry[] = [
    {
      location: 'Mawathagama',
      assignedAt: '2026-01-11 10:46',
      workDays: 1,
      tasks: [
        {
          id: '1',
          assignee: 'Mawathagama Officer',
          assigneeId: 'mawathagama-Mawathagama',
          assigneeRole: 'Police Sergeant (PS)',
          assigneeStation: 'Mawathagama',
          taskNumber: 'Task 01',
          date: '2026-01-11',
          taskDone: 'Complaint Entered',
          detail: '',
          timestamp: '1/11/2026 10:46:00 AM',
          assignedAt: '2026-01-11 10:46',
          workDays: 1,
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
          case 'complainantInfo':
            aValue = a.complainantInfo || '';
            bValue = b.complainantInfo || '';
            break;
          case 'forwardFrom':
            aValue = a.forwardFrom || '';
            bValue = b.forwardFrom || '';
            break;
          case 'currentStatus':
            aValue = a.daysPending || 0;
            bValue = b.daysPending || 0;
            break;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return result;
  }, [complaints, searchQuery, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === null) {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Pagination
  const totalEntries = 696; // From screenshot
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const getProgressBarWidth = (daysPending: number = 0) => {
    const maxDays = 10;
    return Math.min((daysPending / maxDays) * 100, 100);
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
              <h1 className="text-3xl font-bold text-gray-900">Assigned Complaints</h1>
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
                      setCurrentPage(1);
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
                        onClick={() => handleSort('complainantInfo')}
                      >
                        <div className="flex items-center gap-1.5">
                          Complainant Info
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'complainantInfo' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'complainantInfo' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
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
                        onClick={() => handleSort('currentStatus')}
                      >
                        <div className="flex items-center gap-1.5">
                          Current status
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'currentStatus' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'currentStatus' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
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
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.complainantInfo || '-'}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            {complaint.forwardFrom ? (
                              <a href="#" className="text-blue-600 hover:underline">
                                {complaint.forwardFrom}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-xs">
                            <div className="flex flex-col gap-1">
                              <div className="h-1 bg-gray-200 rounded-full w-full">
                                <div 
                                  className="h-1 bg-green-500 rounded-full"
                                  style={{ width: `${getProgressBarWidth(complaint.daysPending)}%` }}
                                />
                              </div>
                              <span className="text-gray-600">{complaint.daysPending || 0} days pending</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleViewDetails(complaint)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Details"
                              >
                                <FaFileAlt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleViewHistory(complaint.id)}
                                className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                title="View History"
                              >
                                <FaHistory className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                title="Information"
                              >
                                <FaInfoCircle className="w-3.5 h-3.5" />
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
