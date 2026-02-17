'use client';

import { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  showCharCount?: boolean;
  maxCharCount?: number;
  currentCharCount?: number;
}

export default function FormTextarea({
  label,
  error,
  showCharCount = false,
  maxCharCount,
  currentCharCount = 0,
  className = '',
  ...props
}: FormTextareaProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <textarea
        className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400 resize-y text-gray-900 placeholder:text-gray-400 min-h-[120px] ${className}`}
        style={{ minHeight: '120px' }}
        {...props}
      />
      {showCharCount && maxCharCount && (
        <p className="text-xs text-gray-500 mt-1">
          {currentCharCount}/{maxCharCount}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

