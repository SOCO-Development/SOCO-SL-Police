'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, Calendar, RotateCcw, SlidersHorizontal, UserRound, ShieldAlert } from 'lucide-react';
import FilterPill from '@/components/dashboard/FilterPill';
import { getLocationRegistry } from '@/lib/api/locationService';
import { CRIME_CATEGORY_DATA } from '@/lib/crimeCategories';

export interface CrimeDashboardFilters {
  locationIds: string[];
  fromDate: string;
  toDate: string;
  officerIds: string[];
  crimeTypes: string[];
}

interface CrimeDashboardFilterBarProps {
  onView: (filters: CrimeDashboardFilters) => void;
}

const DUMMY_OFFICERS = [
  { value: 'off-1', label: 'Insp. R. Perera' },
  { value: 'off-2', label: 'Sgt. N. Fernando' },
  { value: 'off-3', label: 'PC. K. Silva' },
  { value: 'off-4', label: 'Insp. M. Jayasuriya' },
  { value: 'off-5', label: 'Sgt. A. Wickramasinghe' },
  { value: 'off-6', label: 'PC. D. Gunawardena' },
];

export default function CrimeDashboardFilterBar({ onView }: CrimeDashboardFilterBarProps) {
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getLocationRegistry()
      .then((registry) => {
        if (cancelled) return;
        setLocationOptions(registry.locations.map((loc) => ({ value: loc.id, label: loc.name })));
      })
      .catch((err) => console.error('Failed to load SOCO locations', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const locationDisplayText = useMemo(() => {
    if (selectedLocations.length === 0) return 'All Districts';
    if (selectedLocations.length === 1) {
      return locationOptions.find((o) => o.value === selectedLocations[0])?.label ?? '1 selected';
    }
    return `${selectedLocations.length} selected`;
  }, [selectedLocations, locationOptions]);

  const dateDisplayText = useMemo(() => {
    if (!fromDate && !toDate) return 'All dates';
    if (fromDate && toDate) return `${fromDate} — ${toDate}`;
    return fromDate || toDate;
  }, [fromDate, toDate]);

  const officerDisplayText = useMemo(() => {
    if (selectedOfficers.length === 0) return 'All Officers';
    if (selectedOfficers.length === 1) {
      return DUMMY_OFFICERS.find((o) => o.value === selectedOfficers[0])?.label ?? '1 selected';
    }
    return `${selectedOfficers.length} selected`;
  }, [selectedOfficers]);

  const crimeTypeDisplayText = useMemo(() => {
    if (selectedCrimeTypes.length === 0) return 'All Types';
    if (selectedCrimeTypes.length === 1) return selectedCrimeTypes[0];
    return `${selectedCrimeTypes.length} selected`;
  }, [selectedCrimeTypes]);

  const toggleLocation = (value: string) => {
    setSelectedLocations((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const toggleOfficer = (value: string) => {
    setSelectedOfficers((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const toggleCrimeType = (value: string) => {
    setSelectedCrimeTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleApply = () => {
    onView({
      locationIds: selectedLocations,
      fromDate,
      toDate,
      officerIds: selectedOfficers,
      crimeTypes: selectedCrimeTypes,
    });
  };

  const handleReset = () => {
    setSelectedLocations([]);
    setFromDate('');
    setToDate('');
    setSelectedOfficers([]);
    setSelectedCrimeTypes([]);
    onView({ locationIds: [], fromDate: '', toDate: '', officerIds: [], crimeTypes: [] });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 shadow-sm flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium pr-1">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </div>

      <FilterPill label="Location" icon={<MapPin className="w-3.5 h-3.5 text-gray-400" />} displayText={locationDisplayText}>
        {() => (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">SOCO Location</span>
              {selectedLocations.length > 0 && (
                <button onClick={() => setSelectedLocations([])} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {locationOptions.length === 0 ? (
                <p className="px-3.5 py-3 text-sm text-gray-400">Loading locations…</p>
              ) : (
                locationOptions.map((option) => {
                  const checked = selectedLocations.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleLocation(option.value)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                        }`}
                      >
                        {checked && (
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      <span className="text-gray-700">{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </FilterPill>

      <FilterPill label="Date Range" icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />} displayText={dateDisplayText}>
        {() => (
          <div className="p-3.5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-900"
              />
            </div>
          </div>
        )}
      </FilterPill>

      <FilterPill label="Officer" icon={<UserRound className="w-3.5 h-3.5 text-gray-400" />} displayText={officerDisplayText}>
        {() => (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assigned Officer</span>
              {selectedOfficers.length > 0 && (
                <button onClick={() => setSelectedOfficers([])} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {DUMMY_OFFICERS.map((option) => {
                const checked = selectedOfficers.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOfficer(option.value)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="text-gray-700">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FilterPill>

      <FilterPill label="Crime Type" icon={<ShieldAlert className="w-3.5 h-3.5 text-gray-400" />} displayText={crimeTypeDisplayText}>
        {() => (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Crime Type</span>
              {selectedCrimeTypes.length > 0 && (
                <button onClick={() => setSelectedCrimeTypes([])} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {CRIME_CATEGORY_DATA.map((category) => {
                const checked = selectedCrimeTypes.includes(category.name);
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => toggleCrimeType(category.name)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: category.fill }} />
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FilterPill>

      <div className="flex-1" />

      <button
        onClick={handleApply}
        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
      >
        Apply Filters
      </button>
      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </button>
    </div>
  );
}
