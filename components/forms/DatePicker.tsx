'use client';

import { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  error?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  defaultValue,
  className = '',
  error,
}: DatePickerProps) {
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    // Support both dd-mm-yyyy and yyyy-mm-dd formats for backward compatibility
    const parts = dateString.split('-');
    if (parts.length === 3) {
      // If first part is 4 digits, it's yyyy-mm-dd, otherwise dd-mm-yyyy
      if (parts[0].length === 4) {
        const [year, month, day] = parts.map(Number);
        return new Date(year, month - 1, day);
      } else {
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day);
      }
    }
    return new Date();
  };

  const initialDate = value || defaultValue || '';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [currentMonth, setCurrentMonth] = useState(
    initialDate ? parseDate(initialDate) : new Date()
  );
  const [view, setView] = useState<'calendar' | 'month' | 'year'>('calendar');
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedDate(value);
      if (value) {
        setCurrentMonth(parseDate(value));
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
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

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const displayDate = selectedDate ? selectedDate : '';

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    // Convert Sunday (0) to 6, Monday (1) to 0, etc. to make Monday the first day
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (day + 6) % 7;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = formatDate(newDate);
    setSelectedDate(dateString);
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setView('calendar');
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setView('calendar');
  };

  const handleToday = () => {
    const today = new Date();
    const todayString = formatDate(today);
    setCurrentMonth(today);
    setSelectedDate(todayString);
    onChange?.(todayString);
    setView('calendar');
    setIsOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const renderCalendar = () => {
    const days = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);
    const calendarDays = [];
    const today = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    // Previous month's days (shown with low opacity) — use last day of previous month for correct count
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(currentYear, currentMonthIndex - 1, day);
      const dateString = formatDate(date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      calendarDays.push(
        <button
          key={`prev-${day}`}
          onClick={() => {
            setCurrentMonth(new Date(currentYear, currentMonthIndex - 1, 1));
            setSelectedDate(dateString);
            onChange?.(dateString);
            setIsOpen(false);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors opacity-40 ${
            isWeekend
              ? 'text-red-400 hover:opacity-60'
              : 'text-gray-400 hover:opacity-60'
          }`}
        >
          {day}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentYear, currentMonthIndex, day);
      const dateString = formatDate(date);
      const isSelected = dateString === selectedDate;
      const isToday = dateString === formatDate(today);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

      calendarDays.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white shadow-md'
              : isToday
              ? 'bg-blue-100 text-blue-700 font-semibold border-2 border-blue-500'
              : isWeekend
              ? 'text-red-600 hover:bg-red-50 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    // Next month's days (shown with low opacity)
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(currentYear, currentMonthIndex + 1, day);
      const dateString = formatDate(date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      calendarDays.push(
        <button
          key={`next-${day}`}
          onClick={() => {
            setCurrentMonth(new Date(currentYear, currentMonthIndex + 1, 1));
            setSelectedDate(dateString);
            onChange?.(dateString);
            setIsOpen(false);
          }}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors opacity-40 ${
            isWeekend
              ? 'text-red-400 hover:opacity-60'
              : 'text-gray-400 hover:opacity-60'
          }`}
        >
          {day}
        </button>
      );
    }

    return calendarDays;
  };

  return (
    <div className={`w-full relative ${className}`} ref={datePickerRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!isOpen && selectedDate) {
              setCurrentMonth(parseDate(selectedDate));
            }
            setIsOpen(!isOpen);
            if (!isOpen) {
              setView('calendar');
            }
          }}
          className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-left text-gray-900 flex items-center justify-between ${
            error ? 'border-red-300' : ''
          }`}
        >
          <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
            {selectedDate ? displayDate : 'Select date'}
          </span>
          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] p-4 w-64 backdrop-blur-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <button
                onClick={view === 'calendar' ? handlePrevMonth : view === 'month' ? handlePrevYear : () => setCurrentMonth(new Date(currentMonth.getFullYear() - 12, currentMonth.getMonth(), 1))}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors hover:shadow-sm"
              >
                <FaChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('month')}
                  className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                >
                  {monthNames[currentMonth.getMonth()]}
                </button>
                <button
                  onClick={() => setView('year')}
                  className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors px-2 py-1 rounded"
                >
                  {currentMonth.getFullYear()}
                </button>
              </div>
              <button
                onClick={view === 'calendar' ? handleNextMonth : view === 'month' ? handleNextYear : () => setCurrentMonth(new Date(currentMonth.getFullYear() + 12, currentMonth.getMonth(), 1))}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors hover:shadow-sm"
              >
                <FaChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Today Button */}
            <div className="mb-3">
              <button
                onClick={handleToday}
                className="w-full px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                Today
              </button>
            </div>

            {/* Month Selection View */}
            {view === 'month' && (
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                      index === currentMonth.getMonth()
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Year Selection View */}
            {view === 'year' && (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: 20 }, (_, i) => {
                  const year = currentMonth.getFullYear() - 10 + i;
                  const today = new Date();
                  return (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                        year === currentMonth.getFullYear()
                          ? 'bg-blue-600 text-white'
                          : year === today.getFullYear()
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Calendar View */}
            {view === 'calendar' && (
              <>
                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, index) => {
                    const isWeekend = day === 'Sat' || day === 'Sun';
                    return (
                      <div 
                        key={day} 
                        className={`w-8 h-8 flex items-center justify-center text-xs font-semibold ${
                          isWeekend ? 'text-red-500' : 'text-gray-600'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
