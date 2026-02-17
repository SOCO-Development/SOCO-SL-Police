'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ReActivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  reference?: string;
}

const MAX_CHARS = 500;

export default function ReActivateModal({ isOpen, onClose, onSubmit, reference }: ReActivateModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason);
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - light blue/turquoise */}
        <div className="bg-[#2196F3] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Re-Activating Complaint</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Reason for reactivating complaint
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Comment"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            {reason.length}/{MAX_CHARS}
          </p>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
