'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FormInput from '@/components/forms/FormInput';
import FormSelect from '@/components/forms/FormSelect';
import ContentCard from '@/components/layout/ContentCard';
import TableToolbar from '@/components/layout/TableToolbar';
import DataTable, { DataTableColumn } from '@/components/layout/DataTable';
import FilterPrimaryButton from '@/components/buttons/FilterPrimaryButton';
import { ArrowLeft } from 'lucide-react';
import { Truck } from 'phosphor-react';

type VehicleRecord = {
    id: string;
    vehicleNumber: string;
    model: string;
    make: string;
    year: string;
    assignedLocation: string;
    assignedDriver: string;
};

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
    const [activeView, setActiveView] = useState<'add' | 'view'>('view');
    const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<keyof VehicleRecord | string>('vehicleNumber');
    const [sortAsc, setSortAsc] = useState(true);

    const [vehicleNumber, setVehicleNumber] = useState('');
    const [model, setModel] = useState('');
    const [make, setMake] = useState('');
    const [year, setYear] = useState('');
    const [assignedLocation, setAssignedLocation] = useState('');
    const [assignedDriver, setAssignedDriver] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const columns: DataTableColumn<VehicleRecord>[] = [
        { key: 'vehicleNumber', label: 'Vehicle Number', sortable: true, className: 'font-semibold text-gray-700' },
        { key: 'model', label: 'Model', sortable: true },
        { key: 'make', label: 'Make', sortable: true },
        { key: 'year', label: 'Year', sortable: true },
        { key: 'assignedLocation', label: 'Assigned SOCO Location', sortable: true },
        {
            key: 'assignedDriver',
            label: 'Assigned Driver',
            sortable: true,
            render: (value) =>
                value ? (
                    <span>{String(value)}</span>
                ) : (
                    <span className="text-gray-400 italic">Not assigned</span>
                ),
        },
    ];

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

        const key = String(sortKey);
        const sorted = [...searched].sort((a, b) => {
            const aValue = String((a as Record<string, string>)[key] ?? '').toLowerCase();
            const bValue = String((b as Record<string, string>)[key] ?? '').toLowerCase();

            if (aValue < bValue) return sortAsc ? -1 : 1;
            if (aValue > bValue) return sortAsc ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [vehicles, searchTerm, sortKey, sortAsc]);

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
        setActiveView('view');
    };

    const onSort = (key: keyof VehicleRecord | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
            return;
        }
        setSortKey(key);
        setSortAsc(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Header />
            <div className="flex flex-1 relative z-10 w-full pt-14">
                <main className="flex-1 overflow-x-hidden min-w-0 flex flex-col min-h-screen">
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                        <div className="flex items-center gap-3 mb-8">
                            <Link
                                href="/system-config"
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Vehicle Configuration</h2>
                            </div>
                        </div>

                        <ContentCard className="mb-6 p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50">
                                        <Truck className="w-6 h-6" weight="fill" style={{ color: '#f59e0b' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">Manage SOCO Vehicles</h3>
                                        <p className="text-sm text-gray-500">Add new vehicle records and view existing vehicle assignments.</p>
                                    </div>
                                </div>

                                <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setActiveView('view')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeView === 'view'
                                                ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        View Existing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveView('add')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            activeView === 'add'
                                                ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Add New
                                    </button>
                                </div>
                            </div>
                        </ContentCard>

                        {activeView === 'add' && (
                            <ContentCard className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-5">Add New Vehicle</h3>
                                <form onSubmit={onSubmitVehicle} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label="Vehicle Number *"
                                            placeholder="e.g. CAB-4587"
                                            value={vehicleNumber}
                                            onChange={(e) => setVehicleNumber(e.target.value)}
                                        />
                                        <FormInput
                                            label="Model *"
                                            placeholder="e.g. Hilux"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                        />
                                        <FormInput
                                            label="Make"
                                            placeholder="e.g. Toyota"
                                            value={make}
                                            onChange={(e) => setMake(e.target.value)}
                                        />
                                        <FormInput
                                            label="Year"
                                            placeholder="e.g. 2024"
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                        />
                                        <FormSelect
                                            label="Assigned SOCO Location *"
                                            options={locationOptions}
                                            value={assignedLocation}
                                            onChange={(e) => setAssignedLocation(e.target.value)}
                                        />
                                        <FormSelect
                                            label="Assigned Driver (if any)"
                                            options={driverOptions}
                                            value={assignedDriver}
                                            onChange={(e) => setAssignedDriver(e.target.value)}
                                        />
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

                                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="h-[42px] px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <FilterPrimaryButton type="submit" className="sm:w-auto bg-blue-600 hover:bg-blue-700">
                                            Save Vehicle
                                        </FilterPrimaryButton>
                                    </div>
                                </form>
                            </ContentCard>
                        )}

                        {activeView === 'view' && (
                            <ContentCard>
                                <TableToolbar
                                    searchValue={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    left={
                                        <button
                                            type="button"
                                            onClick={() => setActiveView('add')}
                                            className="flex items-center space-x-2 px-4 py-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            <span>Add New Vehicle</span>
                                        </button>
                                    }
                                />

                                <DataTable
                                    columns={columns}
                                    data={filteredVehicles}
                                    keyField="id"
                                    sortKey={sortKey}
                                    sortAsc={sortAsc}
                                    onSort={onSort}
                                    emptyMessage="No vehicles found for the selected search."
                                />
                            </ContentCard>
                        )}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}