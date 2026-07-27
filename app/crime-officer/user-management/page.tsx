'use client';

import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import UserList, { type ManagedUser } from './UserList';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService, officerService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';

export default function UserManagementPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [sortKey, setSortKey] = useState<keyof ManagedUser | string | null>('fullName');
    const [sortAsc, setSortAsc] = useState(true);

    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Select Location' },
    ]);
    const [allLocations, setAllLocations] = useState<Array<{ value: string; label: string }>>([]);

    const [viewLocation, setViewLocation] = useState('');
    const [appliedViewLocation, setAppliedViewLocation] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    const [mobileNumber, setMobileNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [userLocation, setUserLocation] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);



    // ── Load locations on mount ─────────────────────────────────────────
    useEffect(() => {
        const loadLocations = async () => {
            setIsLoadingLocations(true);
            try {
                const locations = await locationService.getAllLocations();
                const options = locations.map((loc) => ({
                    value: String(loc.LOCATION_ID),
                    label: loc.LOCATION_NAME,
                }));
                setLocationOptions([{ value: '', label: 'Select Location' }, ...options]);
                setAllLocations(options);
            } catch (err) {
                console.error('Failed to load locations:', err);
                showErrorAlert('Error', getErrorMessage(err, 'Failed to load SOCO locations.'));
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, []);

    // ── Fetch users + privileges from API ───────────────────────────────
    const fetchUsersForLocation = useCallback(
        async (locationId: string) => {
            setIsLoadingUsers(true);
            setUsersError(null);

            try {
                const locationIds = locationId === 'ALL'
                    ? allLocations.map((loc) => parseInt(loc.value, 10))
                    : [parseInt(locationId, 10)];

                // Fetch officers and privileges in parallel
                const [officers, privileges] = await Promise.all([
                    officerService.getAllOfficers({ locationIds }),
                    officerService.getUserPrivileges(),
                ]);

                // Build a privilege map: SYSTEM_USER_ID → string[]
                const privilegeMap = new Map<string, string[]>();
                for (const priv of privileges) {
                    const key = priv.SYSTEM_USER_ID;
                    if (!privilegeMap.has(key)) {
                        privilegeMap.set(key, []);
                    }
                    privilegeMap.get(key)!.push(priv.PRIVILEGE_NAME);
                }

                // Map officers to ManagedUser[]
                const mapped: ManagedUser[] = officers.map((officer) => {
                    const locName =
                        allLocations.find((l) => l.value === officer.LOCATION_ID)?.label ??
                        `Location ${officer.LOCATION_ID}`;

                    return {
                        id: officer.SYSTEM_USER_ID,
                        fullName: officer.USER_FULL_NAME,
                        mobileNumber: officer.PHONE_MOBILE ?? '—',
                        locationId: officer.LOCATION_ID,
                        locationName: locName,
                        privileges: privilegeMap.get(officer.SYSTEM_USER_ID) ?? [],
                    };
                });

                setUsers(mapped);
            } catch (err) {
                console.error('Failed to load users:', err);
                const msg = getErrorMessage(err, 'Failed to load users for the selected location.');
                setUsersError(msg);
                setUsers([]);
            } finally {
                setIsLoadingUsers(false);
            }
        },
        [allLocations],
    );

    const filteredUsers = useMemo(() => {
        let list = [...users];

        if (appliedViewLocation && appliedViewLocation !== 'ALL') {
            list = list.filter((u) => u.locationId === appliedViewLocation);
        }

        const key = String(sortKey ?? 'fullName');
        return list.sort((a, b) => {
            const aVal = String((a as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const bVal = String((b as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAsc ? cmp : -cmp;
        });
    }, [users, appliedViewLocation, sortKey, sortAsc]);

    const handleSort = (key: keyof ManagedUser | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleView = () => {
        if (!viewLocation) return;
        setAppliedViewLocation(viewLocation);
        setHasSearched(true);
        fetchUsersForLocation(viewLocation);
    };

    const handleClearFilters = () => {
        setViewLocation('');
        setAppliedViewLocation('');
        setHasSearched(false);
        setUsers([]);
        setUsersError(null);
    };

    const resetForm = () => {
        setMobileNumber('');
        setFullName('');
        setUserLocation('');
        setEditingUserId(null);
    };

    const handleEdit = (user: ManagedUser) => {
        setEditingUserId(user.id);
        setMobileNumber(user.mobileNumber);
        setFullName(user.fullName);
        setUserLocation(user.locationId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (user: ManagedUser) => {
        setDeleteTarget(user);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        showErrorAlert('Deleted', `${deleteTarget.fullName} has been removed.`);
        setDeleteTarget(null);
    };



    const onSubmitUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!mobileNumber.trim() || !fullName.trim() || !userLocation) {
            setError('Mobile number, full name and SOCO location are required.');
            return;
        }

        if (!/^0\d{9}$/.test(mobileNumber.trim())) {
            setError('Mobile number must be 10 digits and start with 0 (e.g. 0771234567).');
            return;
        }

        const selectedLocationLabel =
            locationOptions.find((option) => option.value === userLocation)?.label ?? userLocation;

        if (editingUserId) {
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === editingUserId
                        ? {
                              ...u,
                              mobileNumber: mobileNumber.trim(),
                              fullName: fullName.trim(),
                              locationId: userLocation,
                              locationName: selectedLocationLabel,
                          }
                        : u
                )
            );
            setSuccessMessage('User has been updated successfully.');
            showSuccessAlert('Success', 'User has been updated successfully.');
        } else {
            const newUser: ManagedUser = {
                id: `USR-${Date.now()}`,
                mobileNumber: mobileNumber.trim(),
                fullName: fullName.trim(),
                locationId: userLocation,
                locationName: selectedLocationLabel,
                privileges: [],
            };
            setUsers((prev) => [newUser, ...prev]);
            setSuccessMessage('User has been added successfully.');
            showSuccessAlert('Success', 'User has been added successfully.');
        }

        setIsModalOpen(false);
        resetForm();
    };

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="User Management"
                description="Manage SOCO system users and access permissions."
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                <div className="flex gap-3 flex-wrap items-center justify-between">
                    <div className="flex gap-3 flex-wrap items-end flex-1 min-w-[200px]">
                        <div className="min-w-[250px] flex-1 max-w-xs">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select SOCO Location</label>
                            <CustomSelect
                                options={[
                                    { value: '', label: 'Select Location' },
                                    { value: 'ALL', label: 'All Locations' },
                                    ...allLocations,
                                ]}
                                value={viewLocation}
                                onChange={setViewLocation}
                                disabled={isLoadingLocations}
                            />
                        </div>
                        <div className="shrink-0 flex gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleView}
                                className="!min-h-[38px] !py-2 !text-sm px-4"
                                disabled={!viewLocation || isLoadingUsers}
                            >
                                {isLoadingUsers ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading…
                                    </span>
                                ) : (
                                    'View'
                                )}
                            </Button>
                            {(viewLocation || appliedViewLocation || hasSearched) && (
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
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="success"
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="!min-h-[38px] !py-2 !text-sm px-4"
                        >
                            + Add User
                        </Button>
                    </div>
                </div>
            </div>

            {!hasSearched ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                    Select a SOCO location and click View to see available users.
                </div>
            ) : isLoadingUsers ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                    <p className="text-sm text-gray-500">Loading users…</p>
                </div>
            ) : usersError ? (
                <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
                    <p className="text-sm text-red-600">{usersError}</p>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => appliedViewLocation && fetchUsersForLocation(appliedViewLocation)}
                        className="mt-3 !text-sm !text-blue-600 hover:!text-blue-800"
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <UserList
                    users={filteredUsers}
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={handleSort}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    emptyMessage="No users found for the selected SOCO location."
                />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {editingUserId ? 'Edit User' : 'Add New User'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {editingUserId
                                        ? 'Update user details and SOCO location.'
                                        : 'Enter mobile number, full name and assign a SOCO location.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={onSubmitUser} className="px-6 py-5 space-y-5">
                            <div className="grid grid-cols-1 gap-4">
                                <FormInput
                                    label="Mobile Number"
                                    placeholder="e.g. 0771234567"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                />
                                <FormInput
                                    label="Full Name"
                                    placeholder="e.g. Kasun Perera"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="min-h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-gray-400 transition-colors"
                                />
                                <CustomSelect
                                    label="SOCO Location *"
                                    options={locationOptions}
                                    value={userLocation}
                                    onChange={setUserLocation}
                                    disabled={isLoadingLocations}
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

                            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl -mx-6 -mb-5 flex items-center justify-end gap-2">
                                <Button variant="secondary" type="button" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button variant="success" type="submit">
                                    {editingUserId ? 'Update User' : 'Save User'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-800">Delete User</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Are you sure you want to delete <span className="font-semibold">{deleteTarget.fullName}</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-end gap-2">
                            <Button variant="secondary" type="button" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={confirmDelete}
                                className="!bg-red-600 hover:!bg-red-700 !text-white"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
