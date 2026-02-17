'use client';

import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import CustomSelect from '@/components/forms/CustomSelect';
import DatePicker from '@/components/forms/DatePicker';
import FormInput from '@/components/forms/FormInput';

// Custom textarea without label for this modal
const Textarea = ({ value, onChange, rows = 4, maxLength, error, placeholder, className = '' }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
  error?: string;
  placeholder?: string;
  className?: string;
}) => (
  <div>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border-2 ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400 resize-y text-gray-900 placeholder:text-gray-400 ${className}`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

interface UpdateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  onSubmit?: (data: UpdateRequestData) => void;
}

export interface UpdateRequestData {
  taskWillBe: string;
  taskStatus: string;
  remarks: string;
  taskDate: string;
  notifyCustomer: boolean;
  citizenInfo: string;
  attachmentTitle: string;
  attachment: File | null;
}

export default function UpdateRequestModal({ isOpen, onClose, reference, onSubmit }: UpdateRequestModalProps) {
  const [formData, setFormData] = useState<UpdateRequestData>({
    taskWillBe: '',
    taskStatus: '',
    remarks: '',
    taskDate: new Date().toISOString().split('T')[0],
    notifyCustomer: true,
    citizenInfo: '',
    attachmentTitle: '',
    attachment: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateRequestData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof UpdateRequestData, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleChange('attachment', file);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateRequestData, string>> = {};

    if (!formData.taskWillBe) {
      newErrors.taskWillBe = 'Task will be is required';
    }
    if (!formData.taskStatus) {
      newErrors.taskStatus = 'Task status is required';
    }
    if (!formData.remarks) {
      newErrors.remarks = 'Remarks is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit?.(formData);
      // Reset form
      setFormData({
        taskWillBe: '',
        taskStatus: '',
        remarks: '',
        taskDate: new Date().toISOString().split('T')[0],
        notifyCustomer: true,
        citizenInfo: '',
        attachmentTitle: '',
        attachment: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      taskWillBe: '',
      taskStatus: '',
      remarks: '',
      taskDate: new Date().toISOString().split('T')[0],
      notifyCustomer: true,
      citizenInfo: '',
      attachmentTitle: '',
      attachment: null,
    });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const taskOptions = [
    { value: 'task1', label: 'Task 1' },
    { value: 'task2', label: 'Task 2' },
    { value: 'task3', label: 'Task 3' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Update Request of {reference}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task will be */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task will be <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.taskWillBe}
                onChange={(value) => handleChange('taskWillBe', value)}
                options={taskOptions}
                placeholder="Nothing selected"
                error={errors.taskWillBe}
              />
            </div>

            {/* Task Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Status <span className="text-red-500">*</span>
              </label>
              <FormInput
                value={formData.taskStatus}
                onChange={(e) => handleChange('taskStatus', e.target.value)}
                placeholder="Short detail"
                error={errors.taskStatus}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (if any) <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                rows={4}
                maxLength={500}
                error={errors.remarks}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.remarks.length}/500
              </div>
            </div>

            {/* Task Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Date
              </label>
              <DatePicker
                value={formData.taskDate}
                onChange={(value) => handleChange('taskDate', value || '')}
              />
            </div>

            {/* Notify customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notify customer
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('notifyCustomer', true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.notifyCustomer
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('notifyCustomer', false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !formData.notifyCustomer
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Citizen Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Citizen Info (if any)
              </label>
              <Textarea
                value={formData.citizenInfo}
                onChange={(e) => handleChange('citizenInfo', e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.citizenInfo.length}/500
              </div>
            </div>

            {/* Attachment Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachment Title
              </label>
              <FormInput
                value={formData.attachmentTitle}
                onChange={(e) => handleChange('attachmentTitle', e.target.value)}
                placeholder="Attachment Title"
              />
            </div>

            {/* Additional Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Attachment
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                >
                  Choose File
                </button>
                <span className="text-sm text-gray-500">
                  {formData.attachment ? formData.attachment.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
