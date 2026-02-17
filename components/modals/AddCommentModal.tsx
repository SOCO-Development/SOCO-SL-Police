'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import FormTextarea from '@/components/forms/FormTextarea';

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (comment: string) => void;
}

export default function AddCommentModal({ isOpen, onClose, onSubmit }: AddCommentModalProps) {
  const [comment, setComment] = useState('');
  const maxLength = 500;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit?.(comment);
      setComment('');
      onClose();
    }
  };

  const handleCancel = () => {
    setComment('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add comment/Instruction</h2>
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
            <FormTextarea
              label="Comment/Instruction"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setComment(e.target.value);
                }
              }}
              rows={6}
              maxLength={maxLength}
              placeholder="Comment"
              showCharCount={true}
              maxCharCount={maxLength}
              currentCharCount={comment.length}
            />
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
