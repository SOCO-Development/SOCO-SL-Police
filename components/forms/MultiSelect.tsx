'use client';

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown } from 'react-icons/fa';

interface MultiSelectProps {
  label?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  /** Override label styles (e.g. match FieldGroup: uppercase text-xs). */
  labelClassName?: string;
  /** Extra classes for each dropdown option row (e.g. larger Sinhala text). */
  optionRowClassName?: string;
}

type MenuPos = { top?: number; bottom?: number; left: number; width: number; listMaxHeight: number };

export default function MultiSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Nothing selected',
  className = '',
  labelClassName,
  optionRowClassName,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalId = useId().replace(/:/g, '');

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn || typeof window === 'undefined') return;
    const rect = btn.getBoundingClientRect();
    const gap = 4;
    const padding = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(padding, Math.min(rect.left, vw - rect.width - padding));
    const headerApprox = 108;
    const minListHeight = 120;
    const minPanelHeight = headerApprox + minListHeight;

    const availableBelow = vh - padding - (rect.bottom + gap);
    const availableAbove = rect.top - gap - padding;

    /** Prefer opening below; flip above only if below is too cramped but above has more room. */
    const openAbove = availableBelow < minPanelHeight && availableAbove > availableBelow;

    if (openAbove) {
      const listMaxHeight = Math.max(minListHeight, Math.min(240, availableAbove - headerApprox));
      setMenuPos({
        bottom: vh - rect.top + gap,
        left,
        width: rect.width,
        listMaxHeight,
      });
    } else {
      const listMaxHeight = Math.max(minListHeight, Math.min(240, availableBelow - headerApprox));
      setMenuPos({
        top: rect.bottom + gap,
        left,
        width: rect.width,
        listMaxHeight,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onMove = () => updatePosition();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const selectedLabels = useMemo(() => {
    if (!value.length) return [];
    return value.map((selectedValue) => {
      const match = options.find((option) => option.value === selectedValue);
      return match?.label ?? selectedValue;
    });
  }, [options, value]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (selectRef.current?.contains(t)) return;
      const portalEl = document.getElementById(`multiselect-portal-${portalId}`);
      if (portalEl?.contains(t)) return;
      setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, portalId]);

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

  const displayText = (() => {
    if (value.length === 0) return placeholder;
    if (selectedLabels.length <= 2) return selectedLabels.join(', ');
    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2} more`;
  })();

  const dropdown =
    isOpen &&
    menuPos &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        data-scroll-lock-exempt
        id={`multiselect-portal-${portalId}`}
        style={{
          position: 'fixed',
          ...(menuPos.top !== undefined ? { top: menuPos.top } : { bottom: menuPos.bottom }),
          left: menuPos.left,
          width: menuPos.width,
          zIndex: 99999,
        }}
        className="dropdown-blur flex flex-col border border-gray-200 rounded-lg shadow-lg bg-white overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b border-gray-200 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-gray-900"
          />
        </div>
        <div className="flex gap-4 px-3 py-2 border-b border-gray-100 text-sm shrink-0">
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
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: menuPos.listMaxHeight }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-2 ${
                  value.includes(option.value)
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-700 hover:bg-blue-100'
                } ${optionRowClassName ?? ''}`}
              >
                <span
                  className={`w-4 h-4 mt-0.5 border rounded flex-shrink-0 flex items-center justify-center ${
                    value.includes(option.value)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {value.includes(option.value) && (
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
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
      </div>,
      document.body,
    );

  return (
    <div className={`w-full ${className}`} ref={selectRef}>
      {label && (
        <label
          className={labelClassName ?? 'block text-sm font-semibold text-gray-700 mb-2'}
        >
          {label}
        </label>
      )}
      <div>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between hover:border-gray-400"
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
      </div>
      {dropdown}
    </div>
  );
}
