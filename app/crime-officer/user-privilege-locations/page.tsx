'use client';

import { useEffect, useId, useState } from 'react';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import PrivilegeLocationTable, { type PrivilegeLocationRow } from './PrivilegeLocationTable';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService, officerService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { MapPinLine } from 'phosphor-react';

interface UserOption {
    value: string;
    label: string;
    systemUserId: number;
}

export default function UserPrivilegeLocationsPage() {
    const locationFieldId = useId();
    const userFieldId = useId();

    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([
        { value: '', label: 'Select Location' },
    ]);

    const [socoLocations, setSocoLocations] = useState<string[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const [selectedUser, setSelectedUser] = useState('');

    const [isLoadingPrivileges, setIsLoadingPrivileges] = useState(false);
    const [privilegeRows, setPrivilegeRows] = useState<PrivilegeLocationRow[]>([]);
    const [hasViewed, setHasViewed] = useState(false);

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
            } catch (err) {
                console.error('Failed to load locations:', err);
                showErrorAlert('Error', getErrorMessage(err, 'Failed to load SOCO locations.'));
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, []);

    useEffect(() => {
        if (socoLocations.length === 0) {
            setUserOptions([]);
            setSelectedUser('');
            return;
        }

        let cancelled = false;

        const loadUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const officers = await officerService.getAllOfficers({
                    locationIds: socoLocations.map((id) => Number(id)),
                });
                if (cancelled) return;
                const options = officers.map((officer) => ({
                    value: officer.USER_REGI_NO,
                    label: officer.USER_CALLING_NAME || officer.USER_FULL_NAME,
                    systemUserId: Number(officer.SYSTEM_USER_ID),
                }));
                setUserOptions(options);
                setSelectedUser((prev) => (options.some((o) => o.value === prev) ? prev : ''));
            } catch (err) {
                if (cancelled) return;
                console.error('Failed to load users for selected locations:', err);
                showErrorAlert('Error', getErrorMessage(err, 'Failed to load users for the selected locations.'));
                setUserOptions([]);
                setSelectedUser('');
            } finally {
                if (!cancelled) setIsLoadingUsers(false);
            }
        };

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, [socoLocations]);

    const selectedUserOption = userOptions.find((u) => u.value === selectedUser);

    const buildPrivilegeRows = (
        groups: Awaited<ReturnType<typeof officerService.getUserPrivilegeLocations>>,
    ): PrivilegeLocationRow[] =>
        (groups ?? []).flatMap((group) =>
            (group.privileges ?? []).map((privilege) => {
                const uniqueLocations = Array.from(
                    new Map((privilege.locations ?? []).map((loc) => [loc.locationId, loc])).values()
                );
                return {
                    privilegeId: privilege.privilegeId,
                    privilegeTypeId: group.privilegeTypeId,
                    privilegeType: group.privilegeType,
                    privilegeRole: privilege.privilegeRole,
                    locationOptions: uniqueLocations.map((loc) => ({
                        value: String(loc.locationId),
                        label: loc.locationName,
                    })),
                    locationIds: [],
                };
            })
        );

    const handleViewPrivileges = async () => {
        if (!selectedUserOption) return;

        setHasViewed(true);
        setIsLoadingPrivileges(true);
        try {
            const groups = await officerService.getUserPrivilegeLocations(selectedUserOption.systemUserId);
            setPrivilegeRows(buildPrivilegeRows(groups));
        } catch (err) {
            console.error('Failed to load privileges:', err);
            showErrorAlert('Error', getErrorMessage(err, 'Failed to load privileges for this user.'));
            setPrivilegeRows([]);
        } finally {
            setIsLoadingPrivileges(false);
        }
    };

    const handleUpdateLocations = async (row: PrivilegeLocationRow, locationIds: string[]) => {
        if (!selectedUserOption) return;
        try {
            await officerService.setPrivilegeLocations({
                systemUserId: selectedUserOption.systemUserId,
                privilegeId: row.privilegeId,
                locationIds: locationIds.map((id) => Number(id)),
            });
            setPrivilegeRows((prev) =>
                prev.map((r) => (r.privilegeId === row.privilegeId ? { ...r, locationIds } : r))
            );
            showSuccessAlert('Success', 'Privilege locations updated successfully.');

            // Silently refetch in the background so the row reflects the server's
            // actual post-update state, without showing any loading indicator.
            officerService
                .getUserPrivilegeLocations(selectedUserOption.systemUserId)
                .then((groups) => {
                    const freshRows = buildPrivilegeRows(groups);
                    const freshRow = freshRows.find((r) => r.privilegeId === row.privilegeId);
                    if (!freshRow) return;
                    setPrivilegeRows((prev) =>
                        prev.map((r) =>
                            r.privilegeId === row.privilegeId
                                ? { ...freshRow, locationIds }
                                : r
                        )
                    );
                })
                .catch((err) => {
                    console.error('Failed to silently refresh privilege locations:', err);
                });
        } catch (err) {
            console.error('Failed to update privilege locations:', err);
            showErrorAlert('Error', getErrorMessage(err, 'Failed to update privilege locations.'));
        }
    };

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="User Privilege Locations"
                description="Manage location-based access privileges for users."
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 animate-fade-in">
                <div className="flex gap-4 flex-wrap items-end">
                    <div className="min-w-[220px] flex-1 max-w-xs" id={locationFieldId}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                            SOCO Location
                        </label>
                        <MultiSelect
                            options={locationOptions.filter((o) => o.value !== '')}
                            value={socoLocations}
                            onChange={(vals) => {
                                setSocoLocations(vals);
                                setHasViewed(false);
                            }}
                            placeholder={isLoadingLocations ? 'Loading locations…' : 'Select location(s)'}
                        />
                    </div>
                    <div className="min-w-[220px] flex-1 max-w-xs" id={userFieldId}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                            User
                        </label>
                        <CustomSelect
                            options={userOptions}
                            value={selectedUser}
                            onChange={(val) => {
                                setSelectedUser(val);
                                setHasViewed(false);
                            }}
                            disabled={socoLocations.length === 0 || isLoadingUsers}
                            placeholder={
                                socoLocations.length === 0
                                    ? 'Select a location first'
                                    : isLoadingUsers
                                      ? 'Loading users…'
                                      : 'Select user'
                            }
                        />
                    </div>
                    <div className="shrink-0">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleViewPrivileges}
                            disabled={!selectedUser || isLoadingPrivileges}
                            title={!selectedUser ? 'Select a location and user first' : undefined}
                            className="!min-h-[38px] !py-2 !text-sm px-4"
                        >
                            {isLoadingPrivileges ? 'Loading…' : 'View'}
                        </Button>
                    </div>
                </div>
            </div>

            {!hasViewed ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center text-center gap-2">
                    <MapPinLine className="w-9 h-9 text-gray-300" aria-hidden />
                    <p className="text-sm font-medium text-gray-500">No privileges loaded yet</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                        Select a SOCO location and a user above, then click <span className="font-medium text-gray-500">View</span> to see and manage their privilege locations.
                    </p>
                </div>
            ) : (
                <PrivilegeLocationTable
                    rows={privilegeRows}
                    onUpdate={handleUpdateLocations}
                    emptyMessage="No privileges available for this user."
                />
            )}
        </PageLayout>
    );
}
