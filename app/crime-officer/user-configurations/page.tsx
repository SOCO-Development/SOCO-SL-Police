'use client';

import { useEffect, useId, useState } from 'react';
import CustomSelect from '@/components/forms/CustomSelect';
import MultiSelect from '@/components/forms/MultiSelect';
import PrivilegeList, { type PrivilegeOption } from './PrivilegeList';
import { PageHeader, PageLayout, Button } from '@/components/ui';
import { locationService, officerService } from '@/lib/api';
import { getErrorMessage, showErrorAlert, showSuccessAlert } from '@/lib/alerts';
import { ShieldCheck } from 'lucide-react';

interface UserOption {
    value: string;
    label: string;
    systemUserId: number;
}

export default function UserConfigurationPage() {
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

    const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
    const [privilegeOptions, setPrivilegeOptions] = useState<PrivilegeOption[]>([]);

    const [hasViewed, setHasViewed] = useState(false);
    const [savedPrivilegeIds, setSavedPrivilegeIds] = useState<string[]>([]);
    const [selectedPrivilegeIds, setSelectedPrivilegeIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleViewPrivileges = async () => {
        if (!selectedUserOption) return;

        setHasViewed(true);
        setIsLoadingCatalog(true);
        try {
            const groups = await officerService.getUserPrivileges(selectedUserOption.systemUserId);
            const options: PrivilegeOption[] = groups.flatMap((group) =>
                group.configurations.map((config) => ({
                    value: String(config.privilegeConfigurationId),
                    label: `${group.privilegeType} — ${config.privilegeRole.trim()}`,
                }))
            );
            const assignedIdStrings = groups.flatMap((group) =>
                group.configurations.filter((c) => c.isActive).map((c) => String(c.privilegeConfigurationId))
            );
            setPrivilegeOptions(options);
            setSelectedPrivilegeIds(assignedIdStrings);
            setSavedPrivilegeIds(assignedIdStrings);
        } catch (err) {
            console.error('Failed to load privileges:', err);
            showErrorAlert('Error', getErrorMessage(err, 'Failed to load privileges for this user.'));
            setPrivilegeOptions([]);
        } finally {
            setIsLoadingCatalog(false);
        }
    };

    const isDirty =
        selectedPrivilegeIds.length !== savedPrivilegeIds.length ||
        selectedPrivilegeIds.some((id) => !savedPrivilegeIds.includes(id));

    const handleSavePrivileges = async () => {
        if (!selectedUserOption) return;
        setIsSaving(true);
        try {
            await officerService.setUserPrivileges({
                systemUserId: selectedUserOption.systemUserId,
                privilegeConfigurationIds: selectedPrivilegeIds.map((id) => Number(id)),
            });
            setSavedPrivilegeIds(selectedPrivilegeIds);
            showSuccessAlert('Success', 'Privileges have been updated successfully.');
        } catch (err) {
            console.error('Failed to save privileges:', err);
            showErrorAlert('Error', getErrorMessage(err, 'Failed to update privileges.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <PageLayout>
            <PageHeader
                backHref="/crime-officer"
                title="User Configuration"
                description="Manage user privileges, authorization roles and allowed locations."
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
                            disabled={!selectedUser || isLoadingCatalog}
                            title={!selectedUser ? 'Select a location and user first' : undefined}
                            className="!min-h-[38px] !py-2 !text-sm px-4"
                        >
                            {isLoadingCatalog ? 'Loading…' : 'View Privileges'}
                        </Button>
                    </div>
                </div>
            </div>

            {!hasViewed ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="w-9 h-9 text-gray-300" aria-hidden />
                    <p className="text-sm font-medium text-gray-500">No privileges loaded yet</p>
                    <p className="text-sm text-gray-400 max-w-sm">
                        Select a SOCO location and a user above, then click <span className="font-medium text-gray-500">View Privileges</span> to see and manage their access.
                    </p>
                </div>
            ) : (
                <PrivilegeList
                    privilegeOptions={privilegeOptions}
                    selectedPrivilegeIds={selectedPrivilegeIds}
                    onChange={setSelectedPrivilegeIds}
                    userName={selectedUserOption?.label}
                    isDirty={isDirty}
                    isSaving={isSaving}
                    onSave={handleSavePrivileges}
                    emptyMessage="No privileges available in the catalog."
                />
            )}
        </PageLayout>
    );
}
