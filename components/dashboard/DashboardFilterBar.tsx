'use client';

import { useEffect, useMemo, useState } from 'react';
import DatePicker from '@/components/forms/DatePicker';
import MultiSelect from '@/components/forms/MultiSelect';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { getLocationRegistry } from '@/lib/api/locationService';

export interface DashboardFilters {
  locationIds: string[];
  fromDate: string;
  toDate: string;
}

interface DashboardFilterBarProps {
  onView: (filters: DashboardFilters) => void;
}

export default function DashboardFilterBar({ onView }: DashboardFilterBarProps) {
  const [locationOptions, setLocationOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  const handleView = () => {
    onView({ locationIds: selectedLocations, fromDate, toDate });
  };

  const placeholder = useMemo(
    () => (locationOptions.length === 0 ? 'Loading locations...' : 'All SOCO Locations'),
    [locationOptions.length],
  );

  return (
    <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-200/50 rounded-xl p-6 mb-6 shadow-md backdrop-blur-sm relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MultiSelect
          label="SOCO Location"
          value={selectedLocations}
          onChange={setSelectedLocations}
          options={locationOptions}
          placeholder={placeholder}
          className="w-full"
        />
        <DatePicker
          label="From Date"
          value={fromDate}
          onChange={setFromDate}
          className="w-full"
        />
        <DatePicker
          label="To Date"
          value={toDate}
          onChange={setToDate}
          className="w-full"
        />
        <div className="flex items-end">
          <FilterPrimaryButton onClick={handleView}>View</FilterPrimaryButton>
        </div>
      </div>
    </div>
  );
}
