'use client';

import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { MagnifyingGlass } from 'phosphor-react';
import FormInput from '@/components/forms/FormInput';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import UserList, { type ManagedUser, type PrivilegeType, type UserRole } from './UserList';
import { PageHeader, PageLayout, Button, SearchInput, PaginationControls } from '@/components/ui';
import { officerService, userService, ApiError } from '@/lib/api';
import { useLocationData } from '@/lib/hooks/useLocationData';
import { useUserData } from '@/lib/hooks/useUserData';
import ResultPopup, { useResultPopup } from '@/components/modals/ResultPopup';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100].map((n) => ({ value: String(n), label: `${n} per page` }));

export default function UserManagementPage() {
    const { locations } = useLocationData();
    const { rankIdToName } = useUserData();
    const [popup, showPopup, closePopup] = useResultPopup();

    // ── Filter state ──────────────────────────────────────────────────
    const [filterLocations, setFilterLocations] = useState<string[]>([]);
    const [filterDesignations, setFilterDesignations] = useState<string[]>([]);
    const [appliedLocations, setAppliedLocations] = useState<string[]>([]);
    const [appliedDesignations, setAppliedDesignations] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // ── Data state ────────────────────────────────────────────────────
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortKey, setSortKey] = useState<keyof ManagedUser | string | null>('fullName');
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Designations ──────────────────────────────────────────────────
    const [designations, setDesignations] = useState<{ id: string; name: string }[]>([
        { id: '1', name: 'OIC' },
        { id: '5', name: 'Acting OIC' },
        { id: '6', name: 'SOCO Officer' },
        { id: '7', name: 'SOCO Admin' },
        { id: '8', name: 'System Admin' },
    ]);

    // ── Modal / form state ────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mobileNumber, setMobileNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [userLocation, setUserLocation] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

    // ── Inline privilege changes ──────────────────────────────────────
    const [pendingChanges, setPendingChanges] = useState<Record<string, { role?: UserRole; privileges?: PrivilegeType[] }>>({});
    const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

    // ── Derived data ──────────────────────────────────────────────────
    const locationIdToName = useMemo(() => {
        const map = new Map<string, string>();
        locations.forEach((loc) => map.set(loc.id, loc.name));
        return map;
    }, [locations]);

    const locationOptions = useMemo(() => {
        return locations.map((loc) => ({ value: loc.id, label: loc.name }));
    }, [locations]);

    const designationMap = useMemo(() => {
        const map = new Map<string, string>();
        designations.forEach((d) => map.set(d.id, d.name));
        return map;
    }, [designations]);

    const designationOptions = useMemo(() => {
        return designations.map((d) => ({ value: d.id, label: d.name }));
    }, [designations]);

    // ── Location options for the Add/Edit modal ───────────────────────
    const modalLocationOptions = useMemo(() => {
        return [{ value: '', label: 'Select Location' }, ...locationOptions];
    }, [locationOptions]);

    // ── Load designations from API ────────────────────────────────────
    useEffect(() => {
        const loadDesignations = async () => {
            try {
                const apiRes = await userService.getAllDesignations();
                if (apiRes && apiRes.length > 0) {
                    setDesignations(apiRes.map((d) => ({ id: d.USER_DESIGNATION_ID, name: d.USER_DESIGNATION_NAME })));
                }
            } catch (err) {
                console.error('Failed to load designations:', err);
            }
        };
        loadDesignations();
    }, []);

    // ── Fetch officers from API ───────────────────────────────────────
    const fetchOfficers = useCallback(
        async (signal?: { cancelled: boolean }) => {
            setLoading(true);
            try {
                const locationIds = appliedLocations.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
                const designationIds = appliedDesignations.map((val) => parseInt(val, 10)).filter((id) => !isNaN(id));

                const raw = await officerService.getAllOfficers({ locationIds, designationIds });
                if (signal?.cancelled) return;

                const rows: ManagedUser[] = raw.map((o) => ({
                    id: o.SYSTEM_USER_ID,
                    fullName: o.USER_FULL_NAME,
                    mobileNumber: o.PHONE_MOBILE || '',
                    locationId: o.LOCATION_ID,
                    locationName: locationIdToName.get(o.LOCATION_ID) || `Location #${o.LOCATION_ID}`,
                    role: 'Officer' as UserRole,
                    privileges: ['VIEW_ACCESS'] as PrivilegeType[],
                }));
                setUsers(rows);
            } catch (err) {
                if (signal?.cancelled) return;
                const apiError = err instanceof ApiError ? err : new ApiError('Failed to load users');
                showPopup('error', 'Error', apiError.message || 'Failed to load users.');
            } finally {
                if (!signal?.cancelled) setLoading(false);
            }
        },
        [locationIdToName, appliedLocations, appliedDesignations, showPopup],
    );

    useEffect(() => {
        if (!hasSearched) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        fetchOfficers({ cancelled });
        return () => {
            cancelled = true;
        };
    }, [fetchOfficers, hasSearched]);

    // ── Filtering, sorting & pagination ───────────────────────────────
    const filteredUsers = useMemo(() => {
        let list = users.map((u) => {
            const pending = pendingChanges[u.id];
            return pending ? { ...u, ...pending } : u;
        });

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (u) => u.fullName.toLowerCase().includes(q) || u.mobileNumber.includes(q),
            );
        }

        // Sort
        const key = String(sortKey ?? 'fullName');
        list.sort((a, b) => {
            const aVal = String((a as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const bVal = String((b as unknown as Record<string, string>)[key] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return sortAsc ? cmp : -cmp;
        });

        return list;
    }, [users, pendingChanges, search, sortKey, sortAsc]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const effectivePage = Math.min(page, totalPages);
    const paginated = filteredUsers.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

    // ── Handlers ──────────────────────────────────────────────────────
    const handleSort = (key: keyof ManagedUser | string) => {
        if (sortKey === key) {
            setSortAsc((prev) => !prev);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const handleView = () => {
        if (filterLocations.length === 0 || filterDesignations.length === 0) {
            showPopup('error', 'Error', 'Please select both SOCO Location and Designation to view the records.');
            return;
        }
        setAppliedLocations(filterLocations);
        setAppliedDesignations(filterDesignations);
        setHasSearched(true);
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilterLocations([]);
        setFilterDesignations([]);
        setAppliedLocations([]);
        setAppliedDesignations([]);
        setSearch('');
        setHasSearched(false);
        setPage(1);
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
        showPopup('error', 'Deleted', `${deleteTarget.fullName} has been removed.`);
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
            prev.map((u) => (pendingChanges[u.id] ? { ...u, ...pendingChanges[u.id] } : u)),
        );
        showPopup(
            'success',
            'Success',
            `Privilege changes have been submitted for ${pendingChangeCount} user${pendingChangeCount === 1 ? '' : 's'}.`,
        );
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
                        : u,
                ),
            );
            setSuccessMessage('User has been updated successfully.');
            showPopup('success', 'Success', 'User has been updated successfully.');
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
            showPopup('success', 'Success', 'User has been added successfully.');
        }

        setIsModalOpen(false);
        resetForm();
    };

    return (
        <>
            <PageLayout>
                <PageHeader
                    backHref="/crime-officer"
                    title="User Management"
                    description={
                        hasSearched
                            ? `Manage SOCO system users — ${filteredUsers.length} records found`
                            : 'Manage SOCO system users, roles and access permissions.'
                    }
                />

                {/* ── Filter Bar ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                    <div className="flex gap-3 flex-wrap items-center justify-between">
                        <div className="flex gap-3 flex-wrap items-end flex-1 min-w-[200px]">
                            <div className="min-w-[200px] flex-1 max-w-xs">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select SOCO Location</label>
                                <MultiSelect
                                    value={filterLocations}
                                    onChange={setFilterLocations}
                                    options={locationOptions}
                                    placeholder="Select SOCO Location"
                                />
                            </div>
                            <div className="min-w-[180px] flex-1 max-w-xs">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Designation</label>
                                <MultiSelect
                                    value={filterDesignations}
                                    onChange={setFilterDesignations}
                                    options={designationOptions}
                                    placeholder="Select Designation"
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
                                {(filterLocations.length > 0 || filterDesignations.length > 0 || appliedLocations.length > 0 || appliedDesignations.length > 0 || search) && (
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

                        <div className="flex gap-2 items-center">
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

                    {/* Search input — only enabled after a search */}
                    {hasSearched && (
                        <div className="mt-3 max-w-md">
                            <SearchInput
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search name, mobile..."
                                wrapperClassName="w-full"
                                icon={<MagnifyingGlass size={15} />}
                            />
                        </div>
                    )}
                </div>

                {/* ── Content Area ────────────────────────────────────────── */}
                <div className="animate-fade-in">
                    {!hasSearched ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 ring-8 ring-blue-50/50">
                                <MagnifyingGlass size={32} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">User Management</h3>
                            <p className="text-sm text-gray-500 text-center max-w-md">
                                Please select a <span className="font-semibold text-gray-700">SOCO Location</span> and a{' '}
                                <span className="font-semibold text-gray-700">Designation</span> using the filters above, then click
                                the <span className="font-semibold text-gray-700">View</span> button to display records.
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-12 text-gray-400">Loading users...</div>
                    ) : (
                        <>
                            <UserList
                                users={paginated}
                                sortKey={sortKey}
                                sortAsc={sortAsc}
                                onSort={handleSort}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onRoleChange={handleRoleChange}
                                onPrivilegesChange={handlePrivilegesChange}
                                emptyMessage="No users found for the selected SOCO location."
                            />

                            {filteredUsers.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Showing {filteredUsers.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1} to{' '}
                                        {Math.min(effectivePage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-36">
                                            <CustomSelect
                                                value={String(pageSize)}
                                                onChange={(v) => {
                                                    setPageSize(Number(v));
                                                    setPage(1);
                                                }}
                                                options={PAGE_SIZE_OPTIONS}
                                                placeholder="Per page"
                                            />
                                        </div>
                                        <PaginationControls
                                            page={effectivePage}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </PageLayout>

            {/* ── Add / Edit User Modal ───────────────────────────────────── */}
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
                                    options={modalLocationOptions}
                                    value={userLocation}
                                    onChange={setUserLocation}
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

            {/* ── Submit Privileges Confirm Modal ─────────────────────────── */}
            {isSubmitConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-800">Submit Privilege Changes</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Are you sure you want to submit role and privilege changes for{' '}
                                <span className="font-semibold">{pendingChangeCount}</span> user
                                {pendingChangeCount === 1 ? '' : 's'}?
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

            {/* ── Delete Confirm Modal ────────────────────────────────────── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-sm">
                        <div className="px-6 py-5">
                            <h3 className="text-lg font-semibold text-gray-800">Delete User</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold">{deleteTarget.fullName}</span>? This action cannot be
                                undone.
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

            <ResultPopup {...popup} onClose={closePopup} />
        </>
    );
}
