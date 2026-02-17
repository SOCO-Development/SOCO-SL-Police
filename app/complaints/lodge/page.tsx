'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FormInput from '@/components/forms/FormInput';
import FormTextarea from '@/components/forms/FormTextarea';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import TimePicker from '@/components/forms/TimePicker';
import { FaArrowLeft } from 'react-icons/fa';
import { 
  Inbox, 
  FileText, 
  User, 
  MapPin, 
  Building2, 
  Send,
  X,
  History as HistoryIcon
} from 'lucide-react';

export default function LodgeComplaintPage() {
  const router = useRouter();

  // Helper function to format date as dd-mm-yyyy
  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  const [formData, setFormData] = useState({
    receivedVia: 'Call Center - 119',
    receivedSource: '',
    receivedDate: formatDateToDDMMYYYY(new Date()),
    receivedTime: new Date().toTimeString().slice(0, 5),
    complaintType: '',
    mainCategory: '',
    subCategory: '',
    complainantName: '',
    complainantAddress: '',
    complainantOccupation: '',
    placeOfOffence: '',
    incidentDate: formatDateToDDMMYYYY(new Date()),
    incidentTime: new Date().toTimeString().slice(0, 5),
    complaintBrief: '',
    relatedPoliceStation: '',
    division: '',
    apolloCenter: '',
  });

  const [addressCharCount, setAddressCharCount] = useState(0);
  const [briefCharCount, setBriefCharCount] = useState(0);
  const [notifyUser, setNotifyUser] = useState(true);

  const receivedViaOptions = [
    { value: 'Call Center - 119', label: 'Call Center - 119' },
    { value: 'Email', label: 'Email' },
    { value: 'Walk-in', label: 'Walk-in' },
    { value: 'Other', label: 'Other' },
  ];

  const complaintTypeOptions = [
    { value: 'UTR', label: 'UTR' },
    { value: 'Other', label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'complainantAddress') {
      setAddressCharCount(value.length);
    }
    if (field === 'complaintBrief') {
      setBriefCharCount(value.length);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1 w-full relative z-10 pt-14">
        <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
            {/* Page Title and Back Button */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/complaints')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lodge Complaint</h1>
                <p className="text-gray-600 text-sm mt-1">Fill in all required information to submit a new complaint</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <form onSubmit={handleSubmit} className="p-8 space-y-10">
                {/* Received Information Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Received Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CustomSelect
                      label="Received via"
                      value={formData.receivedVia}
                      onChange={(value) => handleInputChange('receivedVia', value)}
                      options={receivedViaOptions}
                    />

                    <div className="w-full">
                      <FormInput
                        label="Received source (Email address, contact number and etc.)"
                        type="text"
                        value={formData.receivedSource}
                        onChange={(e) => handleInputChange('receivedSource', e.target.value)}
                        placeholder="Enter email address, contact number, etc."
                      />
                      <div className="mt-2">
                        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1.5 font-medium transition-colors">
                          <HistoryIcon className="w-3.5 h-3.5" />
                          View History
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Received Date & Time</label>
                      <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                          value={formData.receivedDate}
                          onChange={(value) => handleInputChange('receivedDate', value)}
                        />
                        <TimePicker
                          value={formData.receivedTime}
                          onChange={(value) => handleInputChange('receivedTime', value)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Complaint Details Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-600 rounded-lg text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Complaint Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CustomSelect
                      label="Complaint Type"
                      value={formData.complaintType}
                      onChange={(value) => handleInputChange('complaintType', value)}
                      options={complaintTypeOptions}
                    />

                    <CustomSelect
                      label="Main Category"
                      value={formData.mainCategory}
                      onChange={(value) => handleInputChange('mainCategory', value)}
                      options={[{ value: '', label: 'Nothing Selected' }]}
                    />

                    <CustomSelect
                      label="Sub Category"
                      value={formData.subCategory}
                      onChange={(value) => handleInputChange('subCategory', value)}
                      options={[{ value: '', label: 'Nothing selected' }]}
                    />
                  </div>
                </section>

                {/* Complainant Details Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-600 rounded-lg text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Complainant Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput
                      label="Complainant Name"
                      type="text"
                      value={formData.complainantName}
                      onChange={(e) => handleInputChange('complainantName', e.target.value)}
                      placeholder="Enter full name"
                    />

                    <FormTextarea
                      label="Complainant Address"
                      value={formData.complainantAddress}
                      onChange={(e) => handleInputChange('complainantAddress', e.target.value)}
                      rows={5}
                      showCharCount
                      maxCharCount={200}
                      currentCharCount={addressCharCount}
                      placeholder="Enter complete address"
                    />

                    <FormInput
                      label="Complainant Occupation"
                      type="text"
                      value={formData.complainantOccupation}
                      onChange={(e) => handleInputChange('complainantOccupation', e.target.value)}
                      placeholder="Enter occupation"
                    />
                  </div>
                </section>

                {/* Incident Details Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-600 rounded-lg text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Incident Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput
                      label="Place of Offence"
                      type="text"
                      value={formData.placeOfOffence}
                      onChange={(e) => handleInputChange('placeOfOffence', e.target.value)}
                      placeholder="Enter location of offence"
                    />

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Incident Date & Time</label>
                      <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                          value={formData.incidentDate}
                          onChange={(value) => handleInputChange('incidentDate', value)}
                        />
                        <TimePicker
                          value={formData.incidentTime}
                          onChange={(value) => handleInputChange('incidentTime', value)}
                        />
                      </div>
                    </div>

                    <FormTextarea
                      label="Complaint in Brief"
                      value={formData.complaintBrief}
                      onChange={(e) => handleInputChange('complaintBrief', e.target.value)}
                      rows={8}
                      showCharCount
                      maxCharCount={800}
                      currentCharCount={briefCharCount}
                      placeholder="Provide a detailed description of the complaint..."
                    />
                  </div>
                </section>

                {/* Location/Assignment Details Section */}
                <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-600 rounded-lg text-white">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Location/Assignment Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CustomSelect
                      label="Related Police Station"
                      value={formData.relatedPoliceStation}
                      onChange={(value) => handleInputChange('relatedPoliceStation', value)}
                      options={[{ value: '', label: 'Nothing Selected' }]}
                    />

                    <CustomSelect
                      label="Division"
                      value={formData.division}
                      onChange={(value) => handleInputChange('division', value)}
                      options={[{ value: '', label: 'Nothing selected' }]}
                    />

                    <CustomSelect
                      label="Apollo Center"
                      value={formData.apolloCenter}
                      onChange={(value) => handleInputChange('apolloCenter', value)}
                      options={[{ value: '', label: 'Nothing selected' }]}
                    />
                  </div>
                </section>

                {/* Submit Button */}
                <div className="flex justify-between items-center gap-4 pt-6 border-t-2 border-gray-200 bg-gray-50/50 -mx-8 -mb-8 px-8 pb-8 rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Notify User</label>
                    <button
                      type="button"
                      onClick={() => setNotifyUser(!notifyUser)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        notifyUser ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifyUser ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      className="px-8 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Complaint
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

