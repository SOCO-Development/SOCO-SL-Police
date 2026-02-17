'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  maxCharCount?: number;
  currentCharCount?: number;
}

export default function FormInput({
  label,
  error,
  showCharCount = false,
  maxCharCount,
  currentCharCount = 0,
  className = '',
  ...props
}: FormInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-semibold text-gray-700 mb-2 ${className.includes('font-google-sans') ? 'font-google-sans' : ''}`}>{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${className}`}
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

