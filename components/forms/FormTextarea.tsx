'use client';

import { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { errorClass, labelClass, textareaClass } from '@/lib/ui/styles';

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
      <label className={labelClass}>{label}</label>
      <textarea className={cn(textareaClass, className)} style={{ minHeight: '120px' }} {...props} />
      {showCharCount && maxCharCount && (
        <p className="text-xs text-gray-500 mt-1">
          {currentCharCount}/{maxCharCount}
        </p>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
