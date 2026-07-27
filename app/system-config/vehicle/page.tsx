'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import VehicleList from './VehicleList';
import type { VehicleRecord } from './types';
import { PageHeader, PageLayout, Button, TabBar, MultiSelect } from '@/components/ui';
import { Plus } from 'lucide-react';
import { crimeService, locationService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';

type FilterTab = 'ALL' | 'ADD';

const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Add New', value: 'ADD' },
];



const initialVehicles: VehicleRecord[] = [];

export default function VehicleConfigPage() {
    const [filter, setFilter] = useState<FilterTab>('ALL');
    const [vehicles, setVehicles] = useState<VehicleRecord[]>(initialVehicles);
    const [sortKey, setSortKey] = useState<keyof VehicleRecord | string | null>('vehicleNumber');
    const [sortAsc, setSortAsc] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Select Location' },
    ]);
    const [locationMultiOptions, setLocationMultiOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [filterLocations, setFilterLocations] = useState<string[]>([]);
    const [searchVehicleNo, setSearchVehicleNo] = useState('');
    const [appliedLocations, setAppliedLocations] = useState<string[]>([]);
    const [appliedVehicleNo, setAppliedVehicleNo] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

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
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

    const handleEdit = async (vehicle: VehicleRecord) => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const vehicleIdNum = parseInt(vehicle.id) || 0;
            const apiRes = await crimeService.getVehicleById(vehicleIdNum);

            if (apiRes && apiRes.length > 0) {
                const details = apiRes[0];
                setEditingVehicleId(String(details.VEHICLE_ID));
                setVehicleNumber(details.VEHICLE_REGISTRATION_NO || '');
                setModel(details.VEHICLE_MODEL || '');
                setMake(details.VEHICLE_BRAND || '');
                setYear(String(details.VEHICLE_YEAR || ''));
                setColor(details.VEHICLE_COLOR || '');
                setType(details.VEHICLE_TYPE || '');
                setChassisNo(details.CHASSIS_NO || '');
                setEngineNo(details.ENGINE_NO || '');
                setFuelType(details.FUEL_TYPE || '');

                // Match assigned location value from option value
                const locationVal = locationOptions.find((option) => option.value === String(details.LOCATION_ID))?.value ?? '';
                setAssignedLocation(locationVal);

                setFilter('ADD');
            } else {
                setError('Vehicle details not found on the server.');
                showErrorAlert('Error', 'Vehicle details not found on the server.');
            }
        } catch (err) {
            console.error('Failed to load vehicle details:', err);
            const message = getErrorMessage(err, 'Failed to load vehicle details from server.');
            setError(message);
            showErrorAlert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    // Load locations and vehicles from API when component mounts
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingLocations(true);
            setIsLoading(true);
            try {
                // Fetch locations first
                const locations = await locationService.getPrivilegedOrAllLocations();
                const locationIds = locations.map((loc) => Number(loc.LOCATION_ID)).filter(Boolean);

                // Fetch vehicles for all locations
                const apiVehicles = await crimeService.getAllVehicles({ locationIds });

                // Set location options
                const options = [
                    { value: '', label: 'Select Location' },
                    ...locations.map((loc) => ({
                        value: loc.LOCATION_ID,
                        label: loc.LOCATION_NAME,
                    })),
                ];
                setLocationOptions(options);

                setLocationMultiOptions(
                    locations.map((loc) => ({
                        value: String(loc.LOCATION_ID),
                        label: loc.LOCATION_NAME,
                    }))
                );

                // Create helper lookup map
                const locMap = new Map<string, string>();
                locations.forEach((loc) => {
                    locMap.set(String(loc.LOCATION_ID), loc.LOCATION_NAME);
                });

                // Fetch full details for each vehicle to obtain the vehicle year (since GetAllVehicles doesn't return it)
                const detailedVehicles = await Promise.all(
                    apiVehicles.map(async (v) => {
                        try {
                            const details = await crimeService.getVehicleById(Number(v.VEHICLE_ID));
                            return details[0] || v;
                        } catch {
                            return v;
                        }
                    })
                );

                // Map ApiVehicle -> VehicleRecord
                const mappedVehicles: VehicleRecord[] = detailedVehicles.map((v) => ({
                    id: String(v.VEHICLE_ID),
                    vehicleNumber: v.VEHICLE_REGISTRATION_NO || '',
                    model: v.VEHICLE_MODEL || '',
                    make: v.VEHICLE_BRAND || '',
                    year: String(v.VEHICLE_YEAR || ''),
                    color: v.VEHICLE_COLOR || '',
                    type: v.VEHICLE_TYPE || '',
                    chassisNo: v.CHASSIS_NO || '',
                    engineNo: v.ENGINE_NO || '',
                    fuelType: v.FUEL_TYPE || '',
                    assignedLocation: locMap.get(String(v.LOCATION_ID)) || `Lab #${v.LOCATION_ID}`,
                    locationId: String(v.LOCATION_ID),
                }));

                setVehicles(mappedVehicles);
            } catch (err) {
                console.error('Failed to load initial data:', err);
                const message = err instanceof Error ? err.message : 'Unknown error';
                showErrorAlert('Error', `Failed to load configuration data: ${message}`);
            } finally {
                setIsLoadingLocations(false);
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const filteredVehicles = useMemo(() => {
        let searched = [...vehicles];

        if (appliedVehicleNo.trim()) {
            const vNo = appliedVehicleNo.trim().toLowerCase();
            searched = searched.filter((vehicle) =>
                vehicle.vehicleNumber.toLowerCase().includes(vNo)
            );
        }

        if (appliedLocations.length > 0) {
            searched = searched.filter((vehicle) =>
                vehicle.locationId && appliedLocations.includes(vehicle.locationId)
            );
        }

        const key = String(sortKey ?? 'vehicleNumber');
        return searched.sort((a, b) => {
            const aVal = String((a as Record<string, string>)[key] ?? '').toLowerCase();
            const bVal = String((b as Record<string, string>)[key] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAsc ? cmp : -cmp;
        });
    }, [vehicles, appliedVehicleNo, appliedLocations, sortKey, sortAsc]);

    const handleSort = (key: keyof VehicleRecord | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleView = () => {
        setAppliedLocations(filterLocations);
        setAppliedVehicleNo(searchVehicleNo);
        setHasSearched(true);
    };

    const handleClearFilters = () => {
        setFilterLocations([]);
        setSearchVehicleNo('');
        setAppliedLocations([]);
        setAppliedVehicleNo('');
        setHasSearched(false);
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
        setEditingVehicleId(null);
    };

    const onSubmitVehicle = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!assignedLocation) {
            setError('Assigned location is required.');
            return;
        }

        const hasDuplicateVehicleNo = vehicleNumber.trim()
            ? vehicles.some(
                (vehicle) => vehicle.vehicleNumber.toLowerCase() === vehicleNumber.trim().toLowerCase() && vehicle.id !== editingVehicleId
            )
            : false;

        if (hasDuplicateVehicleNo) {
            setError('This vehicle number already exists. Please use a unique vehicle number.');
            return;
        }

        setIsLoading(true);

        try {
            // Get locationId from the selected location value
            const locationId = parseInt(assignedLocation) || 0;

            if (editingVehicleId) {
                // Call Crime/UpdateVehicle API
                const vehicleIdNum = parseInt(editingVehicleId) || 0;
                await crimeService.updateVehicle({
                    vehicleId: vehicleIdNum,
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

                const selectedLocationLabel =
                    locationOptions.find((option) => option.value === assignedLocation)?.label ?? assignedLocation;

                const updatedVehicle: VehicleRecord = {
                    id: editingVehicleId,
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
                };

                setVehicles((prev) =>
                    prev.map((v) => (v.id === editingVehicleId ? updatedVehicle : v))
                );

                const message = 'Vehicle has been updated successfully.';
                setSuccessMessage(message);
                showSuccessAlert('Success', message);
                resetForm();
                setFilter('ALL');
            } else {
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

                const newVehicle: VehicleRecord = {
                    id: String(response.vehicleId || '') || `VH-${String(vehicles.length + 1).padStart(3, '0')}`,
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
                };

                setVehicles((prev) => [newVehicle, ...prev]);

                const message = response.message || 'Vehicle has been added successfully.';
                setSuccessMessage(message);
                showSuccessAlert('Success', message);
                resetForm();
                setFilter('ALL');
            }
        } catch (err) {
            const message = getErrorMessage(err, `Failed to ${editingVehicleId ? 'update' : 'add'} vehicle. Please try again.`);
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
            />

            <TabBar
                className="mb-6 border-b border-gray-200 pb-0"
                tabs={tabs.map((tab) => ({
                    label: tab.value === 'ADD' && editingVehicleId ? 'Edit Vehicle' : tab.label,
                    value: tab.value,
                    count: tab.value === 'ALL' ? vehicles.length : undefined,
                }))}
                value={filter}
                onChange={(val) => {
                    if (val === 'ALL') {
                        resetForm();
                    }
                    setFilter(val);
                }}
            />

            {filter === 'ADD' && (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col mb-6">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {editingVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {editingVehicleId ? 'Update vehicle details and assignments.' : 'Enter vehicle details and assign the station/driver.'}
                        </p>
                    </div>

                    <form onSubmit={onSubmitVehicle} className="px-6 py-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
                            <div className="flex flex-col gap-4 sm:gap-5">
                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Vehicle Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FormInput
                                            label="Vehicle Number"
                                            placeholder="e.g. CAB-4587"
                                            value={vehicleNumber}
                                            onChange={(e) => setVehicleNumber(e.target.value)}
                                            className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                        />
                                        <FormInput
                                            label="Model"
                                            placeholder="e.g. Hilux"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                        />
                                        <FormInput
                                            label="Brand"
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
                                        <FormInput
                                            label="Color"
                                            placeholder="e.g. Black"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                        />
                                        <CustomSelect
                                            label="Type"
                                            options={[
                                                { value: '', label: 'Select Type' },
                                                { value: 'Suv', label: 'Suv' },
                                                { value: 'Cab', label: 'Cab' },
                                                { value: 'Van', label: 'Van' },
                                                { value: 'Sedan ( car )', label: 'Sedan ( car )' },
                                                { value: 'Three-wheeler', label: 'Three-wheeler' },
                                            ]}
                                            value={type}
                                            onChange={setType}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 sm:gap-5">
                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Technical Specs
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FormInput
                                            label="Chassis No"
                                            placeholder="e.g. MHR123..."
                                            value={chassisNo}
                                            onChange={(e) => setChassisNo(e.target.value)}
                                            className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                        />
                                        <FormInput
                                            label="Engine No"
                                            placeholder="e.g. 2TR-FE..."
                                            value={engineNo}
                                            onChange={(e) => setEngineNo(e.target.value)}
                                            className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                        />
                                        <div className="sm:col-span-2">
                                            <CustomSelect
                                                label="Fuel Type"
                                                options={[
                                                    { value: '', label: 'Select Fuel Type' },
                                                    { value: 'Petrol', label: 'Petrol' },
                                                    { value: 'Diesel', label: 'Diesel' },
                                                    { value: 'Hybrid', label: 'Hybrid' },
                                                    { value: 'Electric', label: 'Electric' },
                                                ]}
                                                value={fuelType}
                                                onChange={setFuelType}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80 space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Assignment Details
                                    </h4>
                                    <div>
                                        <CustomSelect
                                            label="Assigned SOCO Location *"
                                            options={locationOptions}
                                            value={assignedLocation}
                                            onChange={setAssignedLocation}
                                            disabled={isLoadingLocations}
                                        />
                                    </div>
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
                                {editingVehicleId ? 'Cancel' : 'Reset'}
                            </Button>
                            <Button variant="success" type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : editingVehicleId ? 'Update Vehicle' : 'Save Vehicle'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {filter === 'ALL' && (
                <>
                    {/* Search & Filter Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                        <div className="flex gap-3 flex-wrap items-center justify-between">
                            <div className="flex gap-3 flex-wrap items-end flex-1 min-w-[200px]">
                                <div className="min-w-[200px] flex-1 max-w-xs">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={searchVehicleNo}
                                        onChange={(e) => setSearchVehicleNo(e.target.value)}
                                        placeholder="e.g. CAB-4587"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm min-h-[38px]"
                                    />
                                </div>
                                <div className="min-w-[250px] flex-1 max-w-xs">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select SOCO Lab</label>
                                    <MultiSelect
                                        value={filterLocations}
                                        onChange={setFilterLocations}
                                        options={locationMultiOptions}
                                        placeholder="Select SOCO Lab"
                                    />
                                </div>
                                <div className="shrink-0 flex gap-2">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={handleView}
                                        className="!min-h-[38px] !py-2 !text-sm px-4"
                                    >
                                        View
                                    </Button>
                                    {(filterLocations.length > 0 || searchVehicleNo || appliedLocations.length > 0 || appliedVehicleNo || hasSearched) && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleClearFilters}
                                            className="!min-h-[38px] !px-3 !text-sm !text-red-500 hover:!text-red-700"
                                        >
                                            Clear filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!hasSearched ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                            Please enter the vehicle number, select SOCO Lab, and click View to search.
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-12 text-gray-400">Loading vehicles...</div>
                    ) : (
                        <VehicleList
                            vehicles={filteredVehicles}
                            sortKey={sortKey}
                            sortAsc={sortAsc}
                            onSort={handleSort}
                            onEdit={handleEdit}
                            emptyMessage="No vehicles found for the selected search."
                        />
                    )}
                </>
            )}
        </PageLayout>
    );
}
