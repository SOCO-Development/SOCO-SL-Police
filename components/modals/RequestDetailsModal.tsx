'use client';

import { X, FileText, Calendar, User, MapPin, Building2, Clock, Hash, Tag, Mail, Phone, Briefcase, AlertCircle, Shield } from 'lucide-react';
import { Complaint } from '@/types';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint | null;
}

export default function RequestDetailsModal({ isOpen, onClose, complaint }: RequestDetailsModalProps) {
  if (!isOpen || !complaint) return null;

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('open')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (statusLower.includes('resolved') || statusLower.includes('closed')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('in progress') || statusLower.includes('assigned')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Request Details</h2>
              <p className="text-sm text-blue-100 mt-0.5">Complaint Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusColor(complaint.status)}`}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {complaint.status}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Reference: <span className="text-gray-900 font-bold">{complaint.reference}</span>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Number</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.reference}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Complaint Type</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.complaintType}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.category}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Received Via</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.receivedVia}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Received Date & Time</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.receivedDate}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lodged Date & Time</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.receivedDate}</p>
                </div>
              </div>
            </div>

            {/* Complainant Information Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-600 rounded-lg text-white">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Complainant Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Complainant Name</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.complainantName}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Complainant Address</label>
                  </div>
                  <p className="text-gray-500 font-medium text-base">Not provided</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Occupation</label>
                  </div>
                  <p className="text-gray-500 font-medium text-base">Not provided</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lodged By</label>
                  </div>
                  <p className="text-gray-500 font-medium text-base">Not provided</p>
                </div>
              </div>
            </div>

            {/* Incident Information Section */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-600 rounded-lg text-white">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Incident Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Incident Date & Time</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.incidentDate}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Place of Offence</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.placeOfOffence}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:border-orange-300 transition-colors md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Belonging Police Station</label>
                  </div>
                  <p className="text-gray-900 font-semibold text-base">{complaint.policeStation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

