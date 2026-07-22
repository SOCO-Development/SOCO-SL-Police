'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import UserList, { getDummyUsers, type ManagedUser, type PrivilegeType, type UserRole } from './UserList';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService } from '@/lib/api';
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

    const [mobileNumber, setMobileNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [userLocation, setUserLocation] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

    const [pendingChanges, setPendingChanges] = useState<Record<string, { role?: UserRole; privileges?: PrivilegeType[] }>>({});
    const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

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

    const filteredUsers = useMemo(() => {
        let list = users.map((u) => {
            const pending = pendingChanges[u.id];
            return pending ? { ...u, ...pending } : u;
        });

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
    }, [users, pendingChanges, appliedViewLocation, sortKey, sortAsc]);

    const handleSort = (key: keyof ManagedUser | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleView = () => {
        if (viewLocation === 'ALL') {
            setUsers((prev) => {
                const seeded = [...prev];
                allLocations.forEach((loc) => {
                    if (!seeded.some((u) => u.locationId === loc.value)) {
                        seeded.push(...getDummyUsers(loc.value, loc.label));
                    }
                });
                return seeded;
            });
        } else if (viewLocation && !users.some((u) => u.locationId === viewLocation)) {
            const locationName =
                locationOptions.find((option) => option.value === viewLocation)?.label ?? viewLocation;
            setUsers((prev) => [...prev, ...getDummyUsers(viewLocation, locationName)]);
        }
        setAppliedViewLocation(viewLocation);
        setHasSearched(true);
    };

    const handleClearFilters = () => {
        setViewLocation('');
        setAppliedViewLocation('');
        setHasSearched(false);
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

    const handleRoleChange = (userId: string, role: UserRole) => {
        setPendingChanges((prev) => ({ ...prev, [userId]: { ...prev[userId], role } }));
    };

    const handlePrivilegesChange = (userId: string, privileges: PrivilegeType[]) => {
        setPendingChanges((prev) => ({ ...prev, [userId]: { ...prev[userId], privileges } }));
    };

    const pendingChangeCount = Object.keys(pendingChanges).length;

    const confirmSubmitPrivileges = () => {
        setUsers((prev) =>
            prev.map((u) => (pendingChanges[u.id] ? { ...u, ...pendingChanges[u.id] } : u))
        );
        showSuccessAlert('Success', `Privilege changes have been submitted for ${pendingChangeCount} user${pendingChangeCount === 1 ? '' : 's'}.`);
        setPendingChanges({});
        setIsSubmitConfirmOpen(false);
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
                role: 'Officer',
                privileges: ['VIEW_ACCESS'],
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
                description="Manage SOCO system users, roles and access permissions."
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
                            >
                                View
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
                        {pendingChangeCount > 0 && (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setIsSubmitConfirmOpen(true)}
                                className="!min-h-[38px] !py-2 !text-sm px-4"
                            >
                                Submit Privileges ({pendingChangeCount})
                            </Button>
                        )}
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
            ) : (
                <UserList
                    users={filteredUsers}
                    sortKey={sortKey}
                    sortAsc={sortAsc}
                    onSort={handleSort}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRoleChange={handleRoleChange}
                    onPrivilegesChange={handlePrivilegesChange}
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

            {isSubmitConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-800">Submit Privilege Changes</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Are you sure you want to submit role and privilege changes for{' '}
                                <span className="font-semibold">{pendingChangeCount}</span> user{pendingChangeCount === 1 ? '' : 's'}?
                            </p>
                        </div>
                        <div className="border-t border-gray-200 bg-gray-50/70 px-5 py-3 rounded-b-xl flex items-center justify-end gap-2">
                            <Button variant="secondary" type="button" onClick={() => setIsSubmitConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="success" type="button" onClick={confirmSubmitPrivileges}>
                                Submit
                            </Button>
                        </div>
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
