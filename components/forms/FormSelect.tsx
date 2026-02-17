'use client';

import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { FaChevronDown } from 'react-icons/fa';

/** Same option shape as CustomSelect for consistent form primitives */
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
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative z-20">
        <select
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none pr-8 cursor-pointer text-sm text-gray-900 hover:border-gray-400 shadow-sm ${className}`}
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
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

