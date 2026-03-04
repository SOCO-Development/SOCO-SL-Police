'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface MultiSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Nothing selected',
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    const allValues = filteredOptions.map((o) => o.value);
    const allSelected = allValues.every((v) => value.includes(v));
    if (allSelected) {
      onChange(value.filter((v) => !allValues.includes(v)));
    } else {
      onChange([...new Set([...value, ...allValues])]);
    }
  };

  const handleDeselectAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    onChange(value.filter((v) => !filteredValues.includes(v)));
  };

  const displayText = value.length === 0
    ? placeholder
    : `${value.length} item${value.length !== 1 ? 's' : ''} selected`;

  const selectedLabels = value.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean);

  return (
    <div className={`w-full relative ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between hover:border-gray-400"
        >
          <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {displayText}
          </span>
          <FaChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="dropdown-blur absolute top-full left-0 right-0 mt-1 border border-white/50 rounded-lg z-[9999] overflow-hidden min-w-[280px]">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-gray-900"
              />
            </div>
            <div className="flex gap-4 px-3 py-2 border-b border-gray-100 text-sm">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Deselect All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2 ${
                      value.includes(option.value)
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center ${
                        value.includes(option.value)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {value.includes(option.value) && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2.5 text-sm text-gray-500">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
