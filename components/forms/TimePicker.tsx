'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isAM, setIsAM] = useState<boolean>(true);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedTime(value);
      if (value) {
        const [h, m] = value.split(':').map(Number);
        const hour24 = h || 0;
        setHours(hour24);
        setMinutes(m || 0);
        setIsAM(hour24 < 12);
      }
    } else if (defaultValue) {
      const [h, m] = defaultValue.split(':').map(Number);
      const hour24 = h || 0;
      setHours(hour24);
      setMinutes(m || 0);
      setIsAM(hour24 < 12);
    }
  }, [value, defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
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

  const formatTime = (h24: number, m: number): string => {
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const formatDisplayTime = (h24: number, m: number): string => {
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const ampm = h24 < 12 ? 'AM' : 'PM';
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleTimeChange = (newHours: number, newMinutes: number, newAM: boolean) => {
    // Convert 12-hour to 24-hour format
    let hour24 = newHours;
    if (newAM && newHours === 12) hour24 = 0;
    else if (!newAM && newHours !== 12) hour24 = newHours + 12;
    else if (!newAM && newHours === 12) hour24 = 12;

    const timeString = formatTime(hour24, newMinutes);
    setSelectedTime(timeString);
    setHours(hour24);
    setMinutes(newMinutes);
    setIsAM(newAM);
    onChange?.(timeString);
  };

  const handleNow = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const am = h < 12;
    handleTimeChange(am ? (h === 0 ? 12 : h) : (h === 12 ? 12 : h - 12), m, am);
    setIsOpen(false);
  };

  const handleOK = () => {
    setIsOpen(false);
  };

  const displayTime = selectedTime 
    ? formatDisplayTime(hours, minutes)
    : 'hh:mm aa';

  // Generate hours array (1-12 for 12-hour display, but we'll use 0-23 for selection)
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
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between ${
            error ? 'border-red-300' : ''
          }`}
        >
          <span className={selectedTime ? 'text-gray-900' : 'text-gray-400'}>
            {displayTime}
          </span>
          <FaClock className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-lg z-[99999] min-w-[120px]">
                <div className="flex flex-row divide-x divide-gray-200">
                  {/* Hours */}
                  <div className="p-1 max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {hourOptions.map((h) => {
                      const isSelected = h === hours;
                      return (
                        <label
                          key={h}
                          htmlFor={`time-hour-${h}`}
                          className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-gray-100 hover:text-gray-800 ${
                            isSelected ? 'text-white bg-blue-600' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            id={`time-hour-${h}`}
                            name="time-hours"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => {
                              const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                              const am = h < 12;
                              handleTimeChange(h12, minutes, am);
                            }}
                          />
                          <span className="block">{String(h).padStart(2, '0')}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Minutes */}
                  <div className="p-1 max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    {minuteOptions.map((m) => {
                      const isSelected = m === minutes;
                      return (
                        <label
                          key={m}
                          htmlFor={`time-minute-${m}`}
                          className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-gray-100 hover:text-gray-800 ${
                            isSelected ? 'text-white bg-blue-600' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            id={`time-minute-${m}`}
                            name="time-minutes"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => {
                              const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                              handleTimeChange(h12, m, isAM);
                            }}
                          />
                          <span className="block">{String(m).padStart(2, '0')}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* AM/PM */}
                  <div className="p-1 max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                    <label
                      htmlFor="time-am"
                      className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-gray-100 hover:text-gray-800 ${
                        isAM ? 'text-white bg-blue-600' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        id="time-am"
                        name="time-ampm"
                        className="hidden"
                        checked={isAM}
                        onChange={() => {
                          const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                          handleTimeChange(h12, minutes, true);
                        }}
                      />
                      <span className="block">AM</span>
                    </label>
                    <label
                      htmlFor="time-pm"
                      className={`group relative flex justify-center items-center p-1.5 w-10 text-center text-sm text-gray-800 cursor-pointer rounded-md hover:bg-gray-100 hover:text-gray-800 ${
                        !isAM ? 'text-white bg-blue-600' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        id="time-pm"
                        name="time-ampm"
                        className="hidden"
                        checked={!isAM}
                        onChange={() => {
                          const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                          handleTimeChange(h12, minutes, false);
                        }}
                      />
                      <span className="block">PM</span>
                    </label>
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
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
