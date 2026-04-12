'use client';

import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

interface CustomSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  error?: string;
  placeholder?: string;
  /** Show a search box at the top of the dropdown to filter options (long lists). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  className = '',
  error,
  placeholder = 'Select an option',
  searchable = false,
  searchPlaceholder = 'Search…',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filterQuery, setFilterQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const buttonId = useId();
  const portalId = listboxId.replace(/:/g, '');

  const filteredOptions = useMemo(() => {
    if (!searchable || !filterQuery.trim()) return options;
    const q = filterQuery.trim().toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, filterQuery, searchable]);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (selectRef.current?.contains(target)) return;
      const portalEl = document.getElementById(`custom-select-portal-${portalId}`);
      if (portalEl?.contains(target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, portalId]);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }
    const list = searchable ? filteredOptions : options;
    const idx = list.findIndex((o) => o.value === selectedValue);
    setHighlightedIndex(idx >= 0 ? idx : list.length > 0 ? 0 : -1);
  }, [isOpen, selectedValue, options, searchable, filteredOptions]);

  useEffect(() => {
    if (!isOpen) setFilterQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) {
      const t = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [isOpen, searchable]);

  const MIN_SPACE_BELOW = 200;
  const updateDropdownPosition = () => {
    const btn = selectRef.current?.querySelector('button');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom - 4 : 0;
      if (spaceBelow >= MIN_SPACE_BELOW) {
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      } else {
        setDropdownStyle({ bottom: (typeof window !== 'undefined' ? window.innerHeight : 0) - rect.top + 4, left: rect.left, width: rect.width });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const btn = selectRef.current?.querySelector('button');
    if (!btn) return;
    const getScrollableParents = (el: Element): Element[] => {
      const parents: Element[] = [];
      let current = el.parentElement;
      while (current) {
        const s = getComputedStyle(current);
        const o = s.overflow + s.overflowY + s.overflowX;
        if (o.includes('auto') || o.includes('scroll') || o.includes('overlay')) parents.push(current);
        current = current.parentElement;
      }
      return parents;
    };
    const scrollParents = getScrollableParents(btn);
    const handleScroll = () => updateDropdownPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    scrollParents.forEach((p) => p.addEventListener('scroll', handleScroll));
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      scrollParents.forEach((p) => p.removeEventListener('scroll', handleScroll));
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const listForKeys = searchable ? filteredOptions : options;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (searchable) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
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
        setHighlightedIndex((i) => (i < listForKeys.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : listForKeys.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && listForKeys[highlightedIndex]) {
          handleSelect(listForKeys[highlightedIndex].value);
        }
        break;
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && listForKeys[highlightedIndex]) {
          handleSelect(listForKeys[highlightedIndex].value);
        }
        break;
      default:
        break;
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }
    if (!filteredOptions.length) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) => (i < filteredOptions.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
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
          onClick={() => {
            if (!isOpen && selectRef.current) {
              const btn = selectRef.current.querySelector('button');
              if (btn) {
                const rect = btn.getBoundingClientRect();
                const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom - 4 : 0;
                if (spaceBelow >= 200) {
                  setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                } else {
                  setDropdownStyle({ bottom: (typeof window !== 'undefined' ? window.innerHeight : 0) - rect.top + 4, left: rect.left, width: rect.width });
                }
              }
            }
            setIsOpen(!isOpen);
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${buttonId}-label` : undefined}
          aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          className={`group w-full min-h-10 px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between
            border-gray-300 hover:border-gray-400 hover:bg-gray-50/50 active:bg-gray-50
            ${isOpen ? 'border-blue-400 ring-1 ring-blue-500/20' : ''}
            ${error ? 'border-red-300 focus:ring-red-500/30' : ''}`}
        >
          <span className={selectedValue ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FaChevronDown
            className={`w-4 h-4 text-gray-400 transition-all duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-gray-600'
            }`}
            aria-hidden
          />
        </button>

        {isOpen && dropdownStyle && typeof document !== 'undefined' && createPortal(
          <div
            id={`custom-select-portal-${portalId}`}
            style={{
              position: 'fixed',
              ...(dropdownStyle.top != null ? { top: dropdownStyle.top } : { bottom: dropdownStyle.bottom }),
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 120,
            }}
            className="dropdown-blur mt-1 border border-white/50 rounded-xl z-[99999] overflow-hidden shadow-lg bg-white"
          >
            {searchable ? (
              <div className="p-2 border-b border-gray-100 bg-gray-50/90">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full min-h-9 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  autoComplete="off"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : null}
            <ul
              role="listbox"
              id={listboxId}
              aria-labelledby={label ? `${buttonId}-label` : undefined}
              tabIndex={-1}
              className={`custom-select-dropdown overflow-y-auto py-2 px-2 space-y-1.5 ${searchable ? 'max-h-52' : 'max-h-60'}`}
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = selectedValue === option.value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={option.value}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`cursor-pointer min-h-9 px-4 py-2 rounded-md text-left text-sm transition-all duration-150 flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-200 text-blue-900 font-semibold ring-2 ring-blue-400'
                          : isHighlighted
                            ? 'bg-blue-100 text-gray-700'
                            : 'text-gray-700 hover:bg-blue-100'
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected && <FaCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden />}
                    </li>
                  );
                })
              ) : (
                <li className="min-h-9 px-4 py-2 rounded-md text-sm text-gray-500 flex items-center" role="option" aria-disabled>
                  {searchable && filterQuery.trim() ? 'No matches' : 'No options available'}
                </li>
              )}
            </ul>
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
