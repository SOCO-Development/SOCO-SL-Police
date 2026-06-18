'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { errorClass, inputClass, labelClass } from '@/lib/ui/styles';

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
        <label
          className={cn(
            labelClass,
            className.includes('font-google-sans') ? 'font-google-sans' : ''
          )}
        >
          {label}
        </label>
      )}
      <input className={cn(inputClass, className)} {...props} />
      {showCharCount && maxCharCount && (
        <p className="text-xs text-gray-500 mt-1">
          {currentCharCount}/{maxCharCount}
        </p>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
