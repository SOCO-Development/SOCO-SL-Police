'use client';

import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { errorClass, labelClass, selectClass } from '@/lib/ui/styles';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  error?: string;
  options: SelectOption[];
}

export default function FormSelect({
  label,
  error,
  options,
  className = '',
  id: idProp,
  ...props
}: FormSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className="w-full">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative z-20">
        <select
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(selectClass, className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900 bg-white py-2">
              {option.label}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4 z-10" aria-hidden />
      </div>
      {error && (
        <p id={`${id}-error`} className={errorClass} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
