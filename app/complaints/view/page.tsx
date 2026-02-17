'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequestDetailsModal from '@/components/modals/RequestDetailsModal';
import HistoryModal from '@/components/modals/HistoryModal';
import AddCommentModal from '@/components/modals/AddCommentModal';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import { FaFileAlt, FaHistory, FaCopy, FaFileCsv, FaFileExcel, FaFilePdf, FaPrint, FaChevronUp, FaChevronDown, FaArrowLeft, FaInfoCircle, FaPlus } from 'react-icons/fa';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import FilterSection from '@/components/layout/FilterSection';
import ContentCard from '@/components/layout/ContentCard';
import TableToolbar from '@/components/layout/TableToolbar';
import { Complaint, HistoryEntry } from '@/types';

type SortColumn = 'reference' | 'created' | 'policeStation' | 'category' | 'complainantInfo' | 'forwardFrom' | 'status' | 'currentStatus' | null;
type SortDirection = 'asc' | 'desc' | null;

interface ViewComplaint extends Complaint {
  createdTime?: string;
  complainantInfo?: string;
  daysPending?: number;
  citizenInfo?: string;
}

export default function ViewComplaintsPage() {
  const router = useRouter();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false);
  const [selectedComplaintForComment, setSelectedComplaintForComment] = useState<Complaint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedItems1, setSelectedItems1] = useState('7');
  const [selectedItems2, setSelectedItems2] = useState('830');
  const [selectedItems3, setSelectedItems3] = useState('3');
  const entriesPerPage = 10;

  // Sample data - replace with actual data from API
  const complaints: ViewComplaint[] = [
    {
      id: '1',
      reference: '119/UTR/2026/01/35754',
      created: '1/12/2026',
      createdTime: '4:40:00 PM',
      status: 'Complaint Pending',
      complainantName: 'John Doe',
      complaintType: 'UTR',
      category: 'Illicit liquor (Anti-corruption information)',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/12 16:40:00',
      incidentDate: '2026/01/12 16:40:00',
      placeOfOffence: 'ගාලු මුවදොර ෂැංගිලා හෝටලය ඉදිරිපිට',
      policeStation: 'Mirihana',
      forwardFrom: '100187-Hemapala',
      complainantInfo: 'සිංහල',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '2',
      reference: '119/UTR/2026/01/35753',
      created: '1/12/2026',
      createdTime: '4:35:00 PM',
      status: 'Complaint Pending',
      complainantName: 'Jane Smith',
      complaintType: 'UTR',
      category: 'Disputes between the two parties (Incidents)',
      receivedVia: 'Email',
      receivedDate: '2026/01/12 16:35:00',
      incidentDate: '2026/01/12 16:35:00',
      placeOfOffence: 'Colombo',
      policeStation: 'Fort',
      forwardFrom: '100188-Kamal',
      complainantInfo: 'English',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '3',
      reference: '119/UTR/2026/01/35752',
      created: '1/12/2026',
      createdTime: '4:30:00 PM',
      status: 'Complaint Pending',
      complainantName: 'Robert Johnson',
      complaintType: 'UTR',
      category: 'Assault (Crimes)',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/12 16:30:00',
      incidentDate: '2026/01/12 16:30:00',
      placeOfOffence: 'Kandy',
      policeStation: 'Giranegama',
      forwardFrom: '100189-Sandun',
      complainantInfo: 'සිංහල',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '4',
      reference: '119/UTR/2026/01/35751',
      created: '1/12/2026',
      createdTime: '4:25:00 PM',
      status: 'Complaint Pending',
      complainantName: 'Sarah Williams',
      complaintType: 'UTR',
      category: 'Land/Property disputes (Incidents)',
      receivedVia: 'Walk-in',
      receivedDate: '2026/01/12 16:25:00',
      incidentDate: '2026/01/12 16:25:00',
      placeOfOffence: 'Negombo',
      policeStation: 'Fort',
      forwardFrom: '100190-Raj',
      complainantInfo: 'English',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '5',
      reference: '119/UTR/2026/01/35750',
      created: '1/12/2026',
      createdTime: '4:20:00 PM',
      status: 'Complaint Pending',
      complainantName: 'Michael Brown',
      complaintType: 'UTR',
      category: 'Vehicle accident (Traffic offences)',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/12 16:20:00',
      incidentDate: '2026/01/12 16:20:00',
      placeOfOffence: 'Galle',
      policeStation: 'Mirihana',
      forwardFrom: '100191-Kamal',
      complainantInfo: 'සිංහල',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '6',
      reference: '119/UTR/2026/01/35749',
      created: '1/12/2026',
      createdTime: '4:15:00 PM',
      status: 'Complaint Pending',
      complainantName: 'Emily Davis',
      complaintType: 'UTR',
      category: 'Goda - illicit liquor (Anti-corruption information)',
      receivedVia: 'Email',
      receivedDate: '2026/01/12 16:15:00',
      incidentDate: '2026/01/12 16:15:00',
      placeOfOffence: 'Matara',
      policeStation: 'Giranegama',
      forwardFrom: '100192-Sandun',
      complainantInfo: 'English',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
    {
      id: '7',
      reference: '119/UTR/2026/01/35748',
      created: '1/12/2026',
      createdTime: '4:10:00 PM',
      status: 'Complaint Pending',
      complainantName: 'David Wilson',
      complaintType: 'UTR',
      category: 'Property damage (Miscellaneous Complaints)',
      receivedVia: 'Call Center - 119',
      receivedDate: '2026/01/12 16:10:00',
      incidentDate: '2026/01/12 16:10:00',
      placeOfOffence: 'Ratnapura',
      policeStation: 'Fort',
      forwardFrom: '100193-Hemapala',
      complainantInfo: 'සිංහල',
      daysPending: 0,
      citizenInfo: 'Citizen Info',
    },
  ];

  const sampleHistory: HistoryEntry[] = [
    {
      location: 'Mirihana',
      assignedAt: '2026-01-12 16:40',
      workDays: 0,
      tasks: [
        {
          id: '1',
          assignee: 'Sandun',
          assigneeId: '000000',
          assigneeRole: 'Police Sergeant (PS)',
          assigneeStation: 'Mirihana',
          taskNumber: 'Task 01',
          date: '2026-01-12',
          taskDone: 'Complaint Entered',
          detail: '',
          timestamp: '1/12/2026 4:40:00 PM',
          assignedAt: '2026-01-12 16:40',
          workDays: 0,
        },
      ],
    },
  ];

  const itemsSelectedOptions1 = [
    { value: '3', label: '3 items selected' },
    { value: '5', label: '5 items selected' },
    { value: '7', label: '7 items selected' },
    { value: '10', label: '10 items selected' },
  ];

  const itemsSelectedOptions2 = [
    { value: '100', label: '100 items selected' },
    { value: '500', label: '500 items selected' },
    { value: '830', label: '830 items selected' },
    { value: '1000', label: '1000 items selected' },
  ];

  const itemsSelectedOptions3 = [
    { value: '3', label: '3 items selected' },
    { value: '5', label: '5 items selected' },
    { value: '10', label: '10 items selected' },
  ];

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleViewHistory = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setIsHistoryModalOpen(true);
  };

  const handleAddAction = (complaint: Complaint) => {
    setSelectedComplaintForComment(complaint);
    setIsAddCommentModalOpen(true);
  };

  const handleSubmitComment = (comment: string) => {
    // Handle comment submission here
    console.log('Comment submitted:', comment, 'for complaint:', selectedComplaintForComment?.reference);
    // You can add API call here
  };

  const getCategoryColor = (category: string) => {
    if (category.includes('Illicit liquor') || category.includes('Goda - illicit liquor')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (category.includes('Disputes between') || category.includes('Land/Property disputes')) {
      return 'bg-orange-100 text-orange-800';
    } else if (category.includes('Assault')) {
      return 'bg-pink-100 text-pink-800';
    } else if (category.includes('Vehicle accident')) {
      return 'bg-amber-100 text-amber-800';
    } else if (category.includes('Property damage')) {
      return 'bg-orange-200 text-orange-900';
    }
    return 'bg-gray-100 text-gray-700';
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
        (complaint.forwardFrom && complaint.forwardFrom.toLowerCase().includes(searchLower)) ||
        (complaint.complainantInfo && complaint.complainantInfo.toLowerCase().includes(searchLower))
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
  const totalEntries = filteredComplaints.length;
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
              <h1 className="text-3xl font-bold text-gray-900">View Complaints</h1>
            </div>

            {/* Filters - 4 Columns, 2 Rows */}
            <FilterSection>
              <div className="grid grid-cols-4 gap-4">
                {/* First Row - 4 Columns */}
            <DatePicker
                  defaultValue="12-01-2026"
                  className="w-full"
                />
                <TimePicker
                  defaultValue="16:40"
                  className="w-full"
            />
            <DatePicker
                  defaultValue="12-01-2026"
                  className="w-full"
                />
                <TimePicker
                  defaultValue="17:40"
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
                <FilterPrimaryButton>View Tasks</FilterPrimaryButton>
              </div>
            </FilterSection>

            {/* Main Content Area */}
            <ContentCard>
              <TableToolbar
                searchValue={searchQuery}
                onSearchChange={(v) => {
                  setSearchQuery(v);
                  setCurrentPage(1);
                }}
              />

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
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1.5">
                          Status
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'status' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'status' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
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
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            <div className="flex flex-col">
                              <span>{complaint.created}</span>
                              <span className="text-gray-500">{complaint.createdTime}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.policeStation}</td>
                          <td className="py-2.5 px-4 text-xs">
                            <span className={`px-2 py-1 rounded ${getCategoryColor(complaint.category)}`}>
                              {complaint.category}
                            </span>
                          </td>
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          {complaint.status}
                        </span>
                      </td>
                          <td className="py-2.5 px-4 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-700 font-medium">{complaint.policeStation}</span>
                              <div className="flex flex-col gap-1">
                                <div className="h-1 bg-gray-200 rounded-full w-full">
                                  <div 
                                    className="h-1 bg-green-500 rounded-full"
                                    style={{ width: `${getProgressBarWidth(complaint.daysPending)}%` }}
                                  />
                                </div>
                                <span className="text-gray-600">{complaint.daysPending || 0} days pending</span>
                              </div>
                              <a href="#" className="text-blue-600 hover:underline text-xs">
                                {complaint.citizenInfo || 'Citizen Info'}
                              </a>
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
                                onClick={() => handleViewDetails(complaint)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="Print"
                              >
                                <FaPrint className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                title="Information"
                              >
                                <FaInfoCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleAddAction(complaint)}
                                className="p-1 rounded bg-yellow-50 hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-colors"
                                title="Add Action"
                              >
                                <FaPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-xs text-gray-500">
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
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
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
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                  >
                    Next
              </button>
            </div>
          </div>
        </ContentCard>
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

      <AddCommentModal
        isOpen={isAddCommentModalOpen}
        onClose={() => {
          setIsAddCommentModalOpen(false);
          setSelectedComplaintForComment(null);
        }}
        onSubmit={handleSubmitComment}
      />
    </div>
  );
}
