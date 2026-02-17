'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RequestDetailsModal from '@/components/modals/RequestDetailsModal';
import HistoryModal from '@/components/modals/HistoryModal';
import DatePicker from '@/components/forms/DatePicker';
import CustomSelect from '@/components/forms/CustomSelect';
import { FaFileAlt, FaHistory, FaCopy, FaFileCsv, FaFileExcel, FaFilePdf, FaPrint, FaChevronUp, FaChevronDown, FaArrowLeft, FaPrint as FaPrintIcon, FaArrowUp } from 'react-icons/fa';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { HistoryEntry } from '@/types';

interface LostPhoneComplaint {
  id: string;
  reference: string;
  complaintDate: string;
  complaintTime: string;
  nicNumber: string;
  policeStation: string;
  contactNumber: string;
  incidentDate: string;
  incidentTime: string;
  imeiNumber: string;
  operatorFoundStatus: string;
}

type SortColumn = 'id' | 'reference' | 'complaintDate' | 'nicNumber' | 'policeStation' | 'contactNumber' | 'incidentDate' | 'imeiNumber' | 'operatorFoundStatus' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function LostPhoneComplaintsPage() {
  const router = useRouter();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedStation, setSelectedStation] = useState('Matara');
  const [selectedItems, setSelectedItems] = useState('4');
  const entriesPerPage = 10;

  // Sample data for lost phone complaints - replace with actual data from API
  const complaints: LostPhoneComplaint[] = [
    {
      id: '1',
      reference: 'iNEED/2025/17740',
      complaintDate: '9/25/2025',
      complaintTime: '12:21:54 PM',
      nicNumber: '123456789V',
      policeStation: 'Matara',
      contactNumber: '0771234567',
      incidentDate: '9/24/2025',
      incidentTime: '08:15:00 PM',
      imeiNumber: '123456789012345',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '2',
      reference: 'iNEED/2025/17545',
      complaintDate: '9/24/2025',
      complaintTime: '11:45:00 AM',
      nicNumber: '987654321V',
      policeStation: 'Colombo',
      contactNumber: '0712345678',
      incidentDate: '9/23/2025',
      incidentTime: '02:30:00 PM',
      imeiNumber: '987654321098765',
      operatorFoundStatus: 'Found',
    },
    {
      id: '3',
      reference: 'iNEED/2025/17450',
      complaintDate: '9/23/2025',
      complaintTime: '09:20:00 AM',
      nicNumber: '456789123V',
      policeStation: 'Galle',
      contactNumber: '0765432109',
      incidentDate: '9/22/2025',
      incidentTime: '06:00:00 PM',
      imeiNumber: '456789123456789',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '4',
      reference: 'iNEED/2025/17355',
      complaintDate: '9/22/2025',
      complaintTime: '03:15:00 PM',
      nicNumber: '789123456V',
      policeStation: 'Kandy',
      contactNumber: '0754321098',
      incidentDate: '9/21/2025',
      incidentTime: '10:45:00 AM',
      imeiNumber: '789123456789123',
      operatorFoundStatus: 'Found',
    },
    {
      id: '5',
      reference: 'iNEED/2025/17260',
      complaintDate: '9/21/2025',
      complaintTime: '02:10:00 PM',
      nicNumber: '321654987V',
      policeStation: 'Matara',
      contactNumber: '0743210987',
      incidentDate: '9/20/2025',
      incidentTime: '04:30:00 PM',
      imeiNumber: '321654987321654',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '6',
      reference: 'iNEED/2025/17165',
      complaintDate: '9/20/2025',
      complaintTime: '10:30:00 AM',
      nicNumber: '654321987V',
      policeStation: 'Colombo',
      contactNumber: '0732109876',
      incidentDate: '9/19/2025',
      incidentTime: '01:15:00 PM',
      imeiNumber: '654321987654321',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '7',
      reference: 'iNEED/2025/17070',
      complaintDate: '9/19/2025',
      complaintTime: '08:45:00 AM',
      nicNumber: '147258369V',
      policeStation: 'Galle',
      contactNumber: '0721098765',
      incidentDate: '9/18/2025',
      incidentTime: '11:00:00 AM',
      imeiNumber: '147258369147258',
      operatorFoundStatus: 'Found',
    },
    {
      id: '8',
      reference: 'iNEED/2025/16975',
      complaintDate: '9/18/2025',
      complaintTime: '05:20:00 PM',
      nicNumber: '258369147V',
      policeStation: 'Kandy',
      contactNumber: '0710987654',
      incidentDate: '9/17/2025',
      incidentTime: '07:45:00 PM',
      imeiNumber: '258369147258369',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '9',
      reference: 'iNEED/2025/16880',
      complaintDate: '9/17/2025',
      complaintTime: '01:30:00 PM',
      nicNumber: '369147258V',
      policeStation: 'Matara',
      contactNumber: '0709876543',
      incidentDate: '9/16/2025',
      incidentTime: '09:20:00 AM',
      imeiNumber: '369147258369147',
      operatorFoundStatus: 'No record found',
    },
    {
      id: '10',
      reference: 'iNEED/2025/16785',
      complaintDate: '9/16/2025',
      complaintTime: '04:15:00 PM',
      nicNumber: '741852963V',
      policeStation: 'Colombo',
      contactNumber: '0798765432',
      incidentDate: '9/15/2025',
      incidentTime: '03:00:00 PM',
      imeiNumber: '741852963741852',
      operatorFoundStatus: 'Found',
    },
  ];

  const sampleHistory: HistoryEntry[] = [
    {
      location: 'Matara',
      assignedAt: '2025-09-01 10:30',
      workDays: 0,
      tasks: [
        {
          id: '1',
          assignee: 'Officer',
          assigneeId: '000000',
          assigneeRole: 'Police Officer',
          assigneeStation: 'Matara',
          taskNumber: 'Task 01',
          date: '2025-09-01',
          taskDone: 'Complaint Entered',
          detail: '',
          timestamp: '9/1/2025 10:30:00 AM',
          assignedAt: '2025-09-01 10:30',
          workDays: 0,
        },
      ],
    },
  ];

  const stationOptions = [
    { value: 'Matara', label: 'Matara' },
    { value: 'Colombo', label: 'Colombo' },
    { value: 'Galle', label: 'Galle' },
    { value: 'Kandy', label: 'Kandy' },
  ];

  const itemsSelectedOptions = [
    { value: '3', label: '3 items selected' },
    { value: '4', label: '4 items selected' },
    { value: '5', label: '5 items selected' },
    { value: '10', label: '10 items selected' },
  ];

  const handleViewDetails = (complaint: LostPhoneComplaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleViewHistory = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setIsHistoryModalOpen(true);
  };

  const handlePrint = (complaint: LostPhoneComplaint) => {
    // Handle print action
    console.log('Print complaint:', complaint);
  };

  const handleUpdateStatus = (complaint: LostPhoneComplaint) => {
    // Handle update status action
    console.log('Update status for:', complaint);
  };

  // Filter complaints based on search query
  const filteredComplaints = useMemo(() => {
    let result = complaints.filter((complaint) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        complaint.id.toLowerCase().includes(searchLower) ||
        complaint.reference.toLowerCase().includes(searchLower) ||
        complaint.nicNumber.toLowerCase().includes(searchLower) ||
        complaint.policeStation.toLowerCase().includes(searchLower) ||
        complaint.contactNumber.toLowerCase().includes(searchLower) ||
        complaint.imeiNumber.toLowerCase().includes(searchLower) ||
        complaint.operatorFoundStatus.toLowerCase().includes(searchLower)
      );
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortColumn) {
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'reference':
            aValue = a.reference;
            bValue = b.reference;
            break;
          case 'complaintDate':
            aValue = a.complaintDate;
            bValue = b.complaintDate;
            break;
          case 'nicNumber':
            aValue = a.nicNumber;
            bValue = b.nicNumber;
            break;
          case 'policeStation':
            aValue = a.policeStation;
            bValue = b.policeStation;
            break;
          case 'contactNumber':
            aValue = a.contactNumber;
            bValue = b.contactNumber;
            break;
          case 'incidentDate':
            aValue = a.incidentDate;
            bValue = b.incidentDate;
            break;
          case 'imeiNumber':
            aValue = a.imeiNumber;
            bValue = b.imeiNumber;
            break;
          case 'operatorFoundStatus':
            aValue = a.operatorFoundStatus;
            bValue = b.operatorFoundStatus;
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
              <h1 className="text-3xl font-bold text-gray-900">Lost Phone Complaints</h1>
            </div>

            {/* Filters and Actions */}
            <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
              <div className="flex items-center gap-4">
                <DatePicker
                  defaultValue="01-09-2025"
                  className="w-auto"
                />
                <DatePicker
                  defaultValue="12-01-2026"
                  className="w-auto"
                />
                <CustomSelect
                  value={selectedItems}
                  onChange={(value) => setSelectedItems(value)}
                  options={itemsSelectedOptions}
                  className="w-auto"
                />
                <CustomSelect
                  value={selectedStation}
                  onChange={(value) => setSelectedStation(value)}
                  options={stationOptions}
                  className="w-auto"
                />
                <FilterPrimaryButton className="ml-auto w-auto">View Tasks</FilterPrimaryButton>
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
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-1.5">
                          Id
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'id' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'id' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
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
                        onClick={() => handleSort('complaintDate')}
                      >
                        <div className="flex items-center gap-1.5">
                          Complaint Date
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'complaintDate' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'complaintDate' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('nicNumber')}
                      >
                        <div className="flex items-center gap-1.5">
                          NIC Number
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'nicNumber' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'nicNumber' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
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
                        onClick={() => handleSort('contactNumber')}
                      >
                        <div className="flex items-center gap-1.5">
                          Contact Number
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'contactNumber' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'contactNumber' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('incidentDate')}
                      >
                        <div className="flex items-center gap-1.5">
                          Incident Date
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'incidentDate' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'incidentDate' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('imeiNumber')}
                      >
                        <div className="flex items-center gap-1.5">
                          IMEI Number
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'imeiNumber' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'imeiNumber' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th 
                        className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => handleSort('operatorFoundStatus')}
                      >
                        <div className="flex items-center gap-1.5">
                          Operator Found Status
                          <div className="flex flex-row gap-0.5">
                            <FaChevronUp className={`w-2.5 h-2.5 ${sortColumn === 'operatorFoundStatus' && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <FaChevronDown className={`w-2.5 h-2.5 ${sortColumn === 'operatorFoundStatus' && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedComplaints.length > 0 ? (
                      paginatedComplaints.map((complaint, index) => (
                        <tr 
                          key={complaint.id} 
                          className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="py-2.5 px-4 text-xs text-gray-800 font-medium">{complaint.id}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              {complaint.reference}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            <div className="flex flex-col">
                              <span>{complaint.complaintDate}</span>
                              <span className="text-gray-500">{complaint.complaintTime}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.nicNumber}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.policeStation}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.contactNumber}</td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">
                            <div className="flex flex-col">
                              <span>{complaint.incidentDate}</span>
                              <span className="text-gray-500">{complaint.incidentTime}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-gray-600">{complaint.imeiNumber}</td>
                          <td className="py-2.5 px-4 text-xs">
                            {complaint.operatorFoundStatus === 'No record found' ? (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {complaint.operatorFoundStatus}
                              </span>
                            ) : complaint.operatorFoundStatus === 'Found' ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                {complaint.operatorFoundStatus}
                              </span>
                            ) : (
                              <span className="text-gray-700">{complaint.operatorFoundStatus}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleViewDetails(complaint)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Details"
                              >
                                <FaFileAlt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handlePrint(complaint)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                title="Print"
                              >
                                <FaPrintIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(complaint)}
                                className="p-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 transition-colors"
                                title="Update Status"
                              >
                                <FaArrowUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-xs text-gray-500">
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
