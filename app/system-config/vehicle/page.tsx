'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import VehicleList from './VehicleList';
import type { VehicleRecord } from './types';
import { PageHeader, PageLayout, Button, TabBar } from '@/components/ui';
import { Plus } from 'lucide-react';
import { crimeService, locationService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';

type FilterTab = 'ALL' | 'ADD';

const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Add New', value: 'ADD' },
];

const driverOptions = [
    { value: '', label: 'Unassigned' },
    { value: 'dinesh-perera', label: 'Dinesh Perera' },
    { value: 'malith-fonseka', label: 'Malith Fonseka' },
    { value: 'ranga-jayasekara', label: 'Ranga Jayasekara' },
    { value: 'kasun-silva', label: 'Kasun Silva' },
];

const initialVehicles: VehicleRecord[] = [];

export default function VehicleConfigPage() {
    const [filter, setFilter] = useState<FilterTab>('ALL');
    const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<keyof VehicleRecord | string | null>('vehicleNumber');
    const [sortAsc, setSortAsc] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Select Location' },
    ]);

    const [vehicleNumber, setVehicleNumber] = useState('');
    const [model, setModel] = useState('');
    const [make, setMake] = useState('');
    const [year, setYear] = useState('');
    const [color, setColor] = useState('');
    const [type, setType] = useState('');
    const [chassisNo, setChassisNo] = useState('');
    const [engineNo, setEngineNo] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [assignedLocation, setAssignedLocation] = useState('');
    const [assignedDriver, setAssignedDriver] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Load locations from API when component mounts
    useEffect(() => {
        const loadLocations = async () => {
            setIsLoadingLocations(true);
            try {
                const locations = await locationService.getAllLocations();
                const options = [
                    { value: '', label: 'Select Location' },
                    ...locations.map((loc) => ({
                        value: loc.LOCATION_ID,
                        label: loc.LOCATION_NAME,
                    })),
                ];
                setLocationOptions(options);
            } catch (err) {
                console.error('Failed to load locations:', err);
                showErrorAlert('Error', 'Failed to load locations from server');
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, []);

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
        setColor('');
        setType('');
        setChassisNo('');
        setEngineNo('');
        setFuelType('');
        setAssignedLocation('');
        setAssignedDriver('');
    };

    const onSubmitVehicle = async (event: FormEvent<HTMLFormElement>) => {
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

        setIsLoading(true);

        try {
            // Get locationId from the selected location value
            const locationId = parseInt(assignedLocation) || 0;

            // Call Crime/AddVehicle API
            const response = await crimeService.addVehicle({
                locationId: locationId,
                vehicleRegistrationNo: vehicleNumber.trim().toUpperCase(),
                vehicleBrand: make.trim(),
                vehicleModel: model.trim(),
                vehicleColor: color.trim(),
                vehicleType: type.trim(),
                vehicleYear: parseInt(year) || 0,
                chassisNo: chassisNo.trim(),
                engineNo: engineNo.trim(),
                fuelType: fuelType.trim(),
            });

            // Add the new vehicle to the local list
            const selectedLocationLabel =
                locationOptions.find((option) => option.value === assignedLocation)?.label ?? assignedLocation;
            const selectedDriverLabel =
                driverOptions.find((option) => option.value === assignedDriver)?.label ?? '';

            const newVehicle: VehicleRecord = {
                id: response.vehicleId || `VH-${String(vehicles.length + 1).padStart(3, '0')}`,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                model: model.trim(),
                make: make.trim(),
                year: year.trim(),
                color: color.trim(),
                type: type.trim(),
                chassisNo: chassisNo.trim(),
                engineNo: engineNo.trim(),
                fuelType: fuelType.trim(),
                assignedLocation: selectedLocationLabel,
                assignedDriver: selectedDriverLabel,
            };

            setVehicles((prev) => [newVehicle, ...prev]);
            
            const message = response.message || 'Vehicle has been added successfully.';
            setSuccessMessage(message);
            showSuccessAlert('Success', message);
            resetForm();
            setFilter('ALL');
        } catch (err) {
            const message = getErrorMessage(err, 'Failed to add vehicle. Please try again.');
            setError(message);
            showErrorAlert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageLayout>
            <PageHeader
                backHref="/system-config"
                title="Vehicle Configuration"
                description="Manage SOCO vehicles — add and view vehicle assignments."
                actions={
                    <Button variant="primary" onClick={() => setFilter('ADD')}>
                        <Plus className="w-4 h-4" /> Add New Vehicle
                    </Button>
                }
            />

                        <TabBar
                            className="mb-6 border-b border-gray-200 pb-0"
                            tabs={tabs.map((tab) => ({
                              label: tab.label,
                              value: tab.value,
                              count: tab.value === 'ALL' ? vehicles.length : undefined,
                            }))}
                            value={filter}
                            onChange={setFilter}
                        />

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
                                                    disabled={isLoadingLocations}
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
                                        <Button variant="success" type="submit" disabled={isLoading}>
                                            {isLoading ? 'Saving...' : 'Save Vehicle'}
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
        </PageLayout>
    );
}
