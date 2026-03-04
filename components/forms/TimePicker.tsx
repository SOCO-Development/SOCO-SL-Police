'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { FaClock } from 'react-icons/fa';

interface TimePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  error?: string;
}

export default function TimePicker({
  label,
  value,
  onChange,
  defaultValue,
  className = '',
  error,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>(value || defaultValue || '');
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [popupStyle, setPopupStyle] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);
  const portalId = useId().replace(/:/g, '');

  useEffect(() => {
    if (value !== undefined) {
      setSelectedTime(value);
      if (value) {
        const [h, m] = value.split(':').map(Number);
        const hour24 = h || 0;
        setHours(hour24);
        setMinutes(m || 0);
      }
    } else if (defaultValue) {
      const [h, m] = defaultValue.split(':').map(Number);
      const hour24 = h || 0;
      setHours(hour24);
      setMinutes(m || 0);
    }
  }, [value, defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (timePickerRef.current?.contains(target)) return;
      const portalEl = document.getElementById(`time-picker-portal-${portalId}`);
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

  const MIN_SPACE_BELOW = 260;
  const updatePopupPosition = () => {
    const btn = timePickerRef.current?.querySelector('button');
    if (btn && typeof window !== 'undefined') {
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 4;
      if (spaceBelow >= MIN_SPACE_BELOW) {
        setPopupStyle({ top: rect.bottom + 4, left: rect.left });
      } else {
        setPopupStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const btn = timePickerRef.current?.querySelector('button');
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
    const handleScroll = () => updatePopupPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    scrollParents.forEach((p) => p.addEventListener('scroll', handleScroll));
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      scrollParents.forEach((p) => p.removeEventListener('scroll', handleScroll));
    };
  }, [isOpen]);

  const formatTime = (h24: number, m: number): string => {
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const formatDisplayTime = (h24: number, m: number): string => {
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const timeString = formatTime(newHours, newMinutes);
    setSelectedTime(timeString);
    setHours(newHours);
    setMinutes(newMinutes);
    onChange?.(timeString);
  };

  const handleNow = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    handleTimeChange(h, m);
    setIsOpen(false);
  };

  const handleOK = () => {
    setIsOpen(false);
  };

  const displayTime = selectedTime 
    ? formatDisplayTime(hours, minutes)
    : 'HH:mm';

  // Generate hours array in 24-hour format
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`w-full ${className}`} ref={timePickerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!isOpen && timePickerRef.current && typeof window !== 'undefined') {
              const btn = timePickerRef.current.querySelector('button');
              if (btn) {
                const rect = btn.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom - 4;
                if (spaceBelow >= 260) {
                  setPopupStyle({ top: rect.bottom + 4, left: rect.left });
                } else {
                  setPopupStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left });
                }
              }
            }
            setIsOpen(!isOpen);
          }}
          className={`w-full min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between ${
            error ? 'border-red-300' : ''
          }`}
        >
          <span className={selectedTime ? 'text-gray-900' : 'text-gray-400'}>
            {displayTime}
          </span>
          <FaClock className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && popupStyle && typeof document !== 'undefined' && createPortal(
          <div id={`time-picker-portal-${portalId}`} style={{ position: 'fixed', ...(popupStyle.top != null ? { top: popupStyle.top } : { bottom: popupStyle.bottom }), left: popupStyle.left, zIndex: 99999 }} className="dropdown-blur mt-1 w-[150px] border border-white/50 rounded-lg">
                <div className="flex flex-row divide-x divide-gray-200">
                  {/* Hours */}
                  <div className="time-picker-scroll p-1 max-h-56 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                    {hourOptions.map((h) => {
                      const isSelected = h === hours;
                      return (
                        <label
                          key={h}
                          htmlFor={`time-hour-${h}`}
                          className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-blue-200 ${
                            isSelected ? 'text-white bg-blue-600' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            id={`time-hour-${h}`}
                            name="time-hours"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleTimeChange(h, minutes)}
                          />
                          <span className="block">{String(h).padStart(2, '0')}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Minutes */}
                  <div className="time-picker-scroll p-1 max-h-56 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                    {minuteOptions.map((m) => {
                      const isSelected = m === minutes;
                      return (
                        <label
                          key={m}
                          htmlFor={`time-minute-${m}`}
                          className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-blue-200 ${
                            isSelected ? 'text-white bg-blue-600' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            id={`time-minute-${m}`}
                            name="time-minutes"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => handleTimeChange(hours, m)}
                          />
                          <span className="block">{String(m).padStart(2, '0')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

            {/* Footer */}
            <div className="py-2 px-3 flex flex-wrap justify-between items-center gap-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleNow}
                className="text-[13px] font-medium rounded-md bg-white text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:text-blue-700"
              >
                Now
              </button>
              <button
                type="button"
                onClick={handleOK}
                className="py-1 px-2.5 text-[13px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
