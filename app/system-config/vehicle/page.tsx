'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import VehicleList from './VehicleList';
import type { VehicleRecord } from './types';
import Button from '@/components/buttons/Button';
import { ArrowLeft, Plus } from 'lucide-react';

type FilterTab = 'ALL' | 'ADD';

const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Add New', value: 'ADD' },
];

const locationOptions = [
    { value: '', label: 'Select Location' },
    { value: 'colombo-south', label: 'Colombo South' },
    { value: 'colombo-north', label: 'Colombo North' },
    { value: 'kandy', label: 'Kandy' },
    { value: 'galle', label: 'Galle' },
    { value: 'kurunegala', label: 'Kurunegala' },
];

const driverOptions = [
    { value: '', label: 'Unassigned' },
    { value: 'dinesh-perera', label: 'Dinesh Perera' },
    { value: 'malith-fonseka', label: 'Malith Fonseka' },
    { value: 'ranga-jayasekara', label: 'Ranga Jayasekara' },
    { value: 'kasun-silva', label: 'Kasun Silva' },
];

const initialVehicles: VehicleRecord[] = [
    {
        id: 'VH-001',
        vehicleNumber: 'CAB-4587',
        model: 'Hilux',
        make: 'Toyota',
        year: '2021',
        assignedLocation: 'Colombo South',
        assignedDriver: 'Dinesh Perera',
    },
    {
        id: 'VH-002',
        vehicleNumber: 'CAA-1023',
        model: 'Navara',
        make: 'Nissan',
        year: '2020',
        assignedLocation: 'Kandy',
        assignedDriver: '',
    },
    {
        id: 'VH-003',
        vehicleNumber: 'KA-7789',
        model: 'L200',
        make: 'Mitsubishi',
        year: '2022',
        assignedLocation: 'Galle',
        assignedDriver: 'Kasun Silva',
    },
];

export default function VehicleConfigPage() {
    const [filter, setFilter] = useState<FilterTab>('ALL');
    const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<keyof VehicleRecord | string | null>('vehicleNumber');
    const [sortAsc, setSortAsc] = useState(true);

    const [vehicleNumber, setVehicleNumber] = useState('');
    const [model, setModel] = useState('');
    const [make, setMake] = useState('');
    const [year, setYear] = useState('');
    const [assignedLocation, setAssignedLocation] = useState('');
    const [assignedDriver, setAssignedDriver] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const filteredVehicles = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const searched = term
            ? vehicles.filter((vehicle) =>
                [
                    vehicle.vehicleNumber,
                    vehicle.model,
                    vehicle.make,
                    vehicle.year,
                    vehicle.assignedLocation,
                    vehicle.assignedDriver,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(term)
            )
            : vehicles;
        const key = String(sortKey ?? 'vehicleNumber');
        return [...searched].sort((a, b) => {
            const aVal = String((a as Record<string, string>)[key] ?? '').toLowerCase();
            const bVal = String((b as Record<string, string>)[key] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAsc ? cmp : -cmp;
        });
    }, [vehicles, searchTerm, sortKey, sortAsc]);

    const handleSort = (key: keyof VehicleRecord | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const resetForm = () => {
        setVehicleNumber('');
        setModel('');
        setMake('');
        setYear('');
        setAssignedLocation('');
        setAssignedDriver('');
    };

    const onSubmitVehicle = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!vehicleNumber.trim() || !model.trim() || !assignedLocation) {
            setError('Vehicle number, model and assigned location are required.');
            return;
        }

        const hasDuplicateVehicleNo = vehicles.some(
            (vehicle) => vehicle.vehicleNumber.toLowerCase() === vehicleNumber.trim().toLowerCase()
        );

        if (hasDuplicateVehicleNo) {
            setError('This vehicle number already exists. Please use a unique vehicle number.');
            return;
        }

        const selectedLocationLabel =
            locationOptions.find((option) => option.value === assignedLocation)?.label ?? assignedLocation;
        const selectedDriverLabel =
            driverOptions.find((option) => option.value === assignedDriver)?.label ?? '';

        const newVehicle: VehicleRecord = {
            id: `VH-${String(vehicles.length + 1).padStart(3, '0')}`,
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            model: model.trim(),
            make: make.trim(),
            year: year.trim(),
            assignedLocation: selectedLocationLabel,
            assignedDriver: selectedDriverLabel,
        };

        setVehicles((prev) => [newVehicle, ...prev]);
        setSuccessMessage('Vehicle has been added successfully.');
        resetForm();
        setFilter('ALL');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/system-config"
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Vehicle Configuration</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Manage SOCO vehicles — add and view vehicle assignments.</p>
                                </div>
                            </div>
                            <Button variant="primary" onClick={() => setFilter('ADD')}>
                                <Plus className="w-4 h-4" /> Add New Vehicle
                            </Button>
                        </div>

                        <div className="flex gap-2 mb-6 border-b border-gray-200">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setFilter(tab.value)}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                                        filter === tab.value
                                            ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.value === 'ALL' && (
                                        <span
                                            className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                                                filter === tab.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {vehicles.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {filter === 'ADD' && (
                            <div className="bg-white rounded-xl border border-gray-200 flex flex-col mb-6">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800">Add New Vehicle</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Enter vehicle details and assign the station/driver.
                                    </p>
                                </div>

                                <form onSubmit={onSubmitVehicle} className="px-6 py-5 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
                                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                Vehicle Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FormInput
                                                    label="Vehicle Number *"
                                                    placeholder="e.g. CAB-4587"
                                                    value={vehicleNumber}
                                                    onChange={(e) => setVehicleNumber(e.target.value)}
                                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                                />
                                                <FormInput
                                                    label="Model *"
                                                    placeholder="e.g. Hilux"
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                                />
                                                <FormInput
                                                    label="Make"
                                                    placeholder="e.g. Toyota"
                                                    value={make}
                                                    onChange={(e) => setMake(e.target.value)}
                                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                                />
                                                <FormInput
                                                    label="Year"
                                                    placeholder="e.g. 2024"
                                                    value={year}
                                                    onChange={(e) => setYear(e.target.value)}
                                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                Assignment Details
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <CustomSelect
                                                    label="Assigned SOCO Location *"
                                                    options={locationOptions}
                                                    value={assignedLocation}
                                                    onChange={setAssignedLocation}
                                                />
                                                <CustomSelect
                                                    label="Assigned Driver (if any)"
                                                    options={driverOptions}
                                                    value={assignedDriver}
                                                    onChange={setAssignedDriver}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                                            {error}
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                                            {successMessage}
                                        </div>
                                    )}

                                    <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl -mx-6 -mb-5 flex items-center justify-end gap-2">
                                        <Button variant="secondary" type="button" onClick={resetForm}>
                                            Reset
                                        </Button>
                                        <Button variant="success" type="submit">
                                            Save Vehicle
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {filter === 'ALL' && (
                            <>
                                <div className="mb-4 flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Search:</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search vehicles..."
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm max-w-xs"
                                    />
                                </div>
                                <VehicleList
                                    vehicles={filteredVehicles}
                                    sortKey={sortKey}
                                    sortAsc={sortAsc}
                                    onSort={handleSort}
                                    emptyMessage="No vehicles found for the selected search."
                                />
                            </>
                        )}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
