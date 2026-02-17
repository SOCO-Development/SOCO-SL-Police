'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface CustomSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  error?: string;
  placeholder?: string;
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  error,
  placeholder = 'Select an option',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const buttonId = useId();

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((o) => o.value === selectedValue);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, selectedValue, options]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i < options.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : options.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      default:
        break;
    }
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div className={`w-full relative ${className}`} ref={selectRef}>
      {label && (
        <label id={`${buttonId}-label`} className="block text-sm font-semibold text-gray-700 mb-2" htmlFor={buttonId}>
          {label}
        </label>
      )}
      <div className="relative">
        <button
          id={buttonId}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${buttonId}-label` : undefined}
          aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between hover:border-gray-400 ${
            error ? 'border-red-300' : ''
          }`}
        >
          <span className={selectedValue ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FaChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>

        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? `${buttonId}-label` : undefined}
            tabIndex={-1}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto py-1"
          >
            {options.length > 0 ? (
              options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={selectedValue === option.value}
                  className={`cursor-pointer px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedValue === option.value
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : index === highlightedIndex
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2.5 text-sm text-gray-500" role="option" aria-disabled>
                No options available
              </li>
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
