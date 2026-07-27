'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import CustomSelect from '@/components/forms/CustomSelect';
import UserList, { type ManagedUser } from './UserList';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService, officerService } from '@/lib/api';
import { getErrorMessage, showErrorAlert } from '@/lib/alerts';

export default function UserManagementPage() {
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

    // ── Fetch users, privileges, and privilege locations from API ───────
    const fetchUsersForLocation = useCallback(
        async (locationId: string) => {
            setIsLoadingUsers(true);
            setUsersError(null);

            try {
                const locationIds = locationId === 'ALL'
                    ? allLocations.map((loc) => parseInt(loc.value, 10))
                    : [parseInt(locationId, 10)];

                // Fetch officers, privileges, and privilege locations in parallel
                const [officers, privileges, privilegeLocations] = await Promise.all([
                    officerService.getAllOfficers({ locationIds }),
                    officerService.getUserPrivileges(),
                    officerService.getUserPrivilegeLocations(),
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

                // Build a privilege locations map: SYSTEM_USER_ID → string[]
                const privilegeLocationsMap = new Map<string, string[]>();
                for (const locPriv of privilegeLocations) {
                    const key = locPriv.SYSTEM_USER_ID;
                    if (!privilegeLocationsMap.has(key)) {
                        privilegeLocationsMap.set(key, []);
                    }
                    // Find location label for display
                    const locLabel =
                        allLocations.find((l) => l.value === locPriv.LOCATION_ID)?.label ??
                        `Location ${locPriv.LOCATION_ID}`;
                    privilegeLocationsMap.get(key)!.push(locLabel);
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
                        privilegeLocations: privilegeLocationsMap.get(officer.SYSTEM_USER_ID) ?? [],
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
                    emptyMessage="No users found for the selected SOCO location."
                />
            )}
        </PageLayout>
    );
}
